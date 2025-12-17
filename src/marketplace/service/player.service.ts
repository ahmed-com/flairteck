import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  DataSource,
  FindOptionsWhere,
  ILike,
  MoreThanOrEqual,
  LessThanOrEqual,
  Between,
} from "typeorm";
import { Player } from "../schema/player.entity";
import { Team } from "../schema/team.entity";
import { GetListedPlayersDto } from "../dto/getListedPlayers.dto";
import { ListPlayerDto } from "../dto/listPlayer.dto";
import { SafeUserObject } from "src/auth/service/auth.service";
import { Decimal } from "decimal.js";
import { BuyPlayerDto } from "../dto/buyPlayer.dto";

@Injectable()
export class PlayerService {
  private readonly MAX_PLAYERS_PER_TEAM = 25;
  private readonly MIN_PLAYERS_PER_TEAM = 15;
  private readonly TRANSFER_MARKET_PRICE_MULTIPLIER = new Decimal(0.95);

  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly dataSource: DataSource
  ) {}

  async getListedPlayers(query: GetListedPlayersDto): Promise<Player[]> {
    const conditions: FindOptionsWhere<Player> = { isListed: true };

    if (query.playerName) {
      conditions.name = ILike(`%${query.playerName}%`);
    }

    // Build price conditions using TypeORM operators
    if (query.minPrice && query.maxPrice) {
      conditions.price = Between(
        query.minPrice.toString(),
        query.maxPrice.toString()
      );
    } else if (query.minPrice) {
      conditions.price = MoreThanOrEqual(query.minPrice.toString());
    } else if (query.maxPrice) {
      conditions.price = LessThanOrEqual(query.maxPrice.toString());
    }

    if (query.teamName) {
      conditions.team = {
        name: ILike(`%${query.teamName}%`),
      };
    }

    return this.playerRepository.find({
      where: conditions,
      relations: ["team"],
    });
  }

  async listPlayer(
    user: SafeUserObject,
    listPlayerDto: ListPlayerDto
  ): Promise<Player | null> {
    const player = await this.playerRepository.findOne({
      where: { id: listPlayerDto.id },
      relations: ["team"],
    });
    if (!player) {
      return null;
    }
    if (player.team.ownerId !== user.id) {
      return null;
    }
    player.isListed = true;
    player.price = listPlayerDto.price;
    return this.playerRepository.save(player);
  }

  async delistPlayer(
    user: SafeUserObject,
    playerId: number
  ): Promise<Player | null> {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ["team"],
    });
    if (!player) {
      return null;
    }
    if (player.team.ownerId !== user.id) {
      return null;
    }
    player.isListed = false;
    player.price = null;
    return this.playerRepository.save(player);
  }

  async findOne(id: number): Promise<Player | null> {
    return this.playerRepository.findOneBy({ id });
  }

  async buyPlayer(
    user: SafeUserObject,
    offer: BuyPlayerDto
  ): Promise<Player | null> {
    const buyingTeam = await this.teamRepository.findOneBy({
      ownerId: user.id,
    });

    if (!buyingTeam) {
      return null;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // First, get player with team relation (no lock) to check ownership
      const playerWithTeam = await queryRunner.manager.findOne(Player, {
        where: { id: offer.id },
        relations: ["team"],
      });

      if (
        !playerWithTeam ||
        !playerWithTeam.isListed ||
        !playerWithTeam.price ||
        playerWithTeam.team.ownerId === user.id
      ) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      const teamIds = [buyingTeam.id, playerWithTeam.team.id].sort(
        (a, b) => a - b
      ); // To prevent deadlocks

      const team1 = await queryRunner.manager.findOne(Team, {
        where: { id: teamIds[0] },
        lock: { mode: "pessimistic_write" },
        loadEagerRelations: false,
      });

      const team2 = await queryRunner.manager.findOne(Team, {
        where: { id: teamIds[1] },
        lock: { mode: "pessimistic_write" },
        loadEagerRelations: false,
      });

      // Lock the player for update
      const player = await queryRunner.manager.findOne(Player, {
        where: { id: offer.id },
        lock: { mode: "pessimistic_write" },
        loadEagerRelations: false,
      });

      if (!team1 || !team2 || !player) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      // Re-check conditions after locking (in case of concurrent updates)
      if (!player.isListed || !player.price) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      const lockedBuyingTeam = team1.id === buyingTeam.id ? team1 : team2;
      const lockedListingTeam =
        team1.id === playerWithTeam.team.id ? team1 : team2;

      // Count players for each team
      const buyingTeamPlayerCount = await queryRunner.manager.count(Player, {
        where: { teamId: lockedBuyingTeam.id },
      });
      const listingTeamPlayerCount = await queryRunner.manager.count(Player, {
        where: { teamId: lockedListingTeam.id },
      });

      if (
        buyingTeamPlayerCount >= this.MAX_PLAYERS_PER_TEAM ||
        listingTeamPlayerCount <= this.MIN_PLAYERS_PER_TEAM ||
        lockedBuyingTeam.budget.lessThan(offer.price) ||
        offer.price.lessThan(
          player.price.mul(this.TRANSFER_MARKET_PRICE_MULTIPLIER)
        )
      ) {
        await queryRunner.rollbackTransaction();
        return null;
      }
      lockedBuyingTeam.budget = lockedBuyingTeam.budget.minus(offer.price);
      lockedListingTeam.budget = lockedListingTeam.budget.plus(offer.price);

      player.teamId = lockedBuyingTeam.id;
      player.isListed = false;
      player.price = null;

      await queryRunner.manager.save(lockedBuyingTeam);
      await queryRunner.manager.save(lockedListingTeam);
      await queryRunner.manager.save(player);

      await queryRunner.commitTransaction();

      // Return player with team relation for response
      player.team = lockedBuyingTeam;
      return player;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
