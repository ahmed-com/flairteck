import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, FindOptionsWhere, ILike } from "typeorm";
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

    conditions.price = {
      greaterThanOrEqualTo: query.minPrice,
      lessThanOrEqualTo: query.maxPrice,
    } as FindOptionsWhere<Decimal>;

    if (query.teamName) {
      conditions.team = {
        name: ILike(`%${query.teamName}%`),
      };
    }

    return this.playerRepository.find({ where: conditions });
  }

  async listPlayer(
    user: SafeUserObject,
    listPlayerDto: ListPlayerDto
  ): Promise<Player | null> {
    const player = await this.playerRepository.findOneBy({
      id: listPlayerDto.id,
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
    const player = await this.playerRepository.findOneBy({ id: playerId });
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
      const player = await queryRunner.manager.findOne(Player, {
        where: { id: offer.id },
        lock: { mode: "for_no_key_update" },
      });

      if (
        !player ||
        !player.isListed ||
        !player.price ||
        player.team.ownerId === user.id
      ) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      const teamIds = [buyingTeam.id, player.team.id].sort((a, b) => a - b); // To prevent deadlocks

      const team1 = await queryRunner.manager.findOne(Team, {
        where: { id: teamIds[0] },
        lock: { mode: "for_no_key_update" },
      });

      const team2 = await queryRunner.manager.findOne(Team, {
        where: { id: teamIds[1] },
        lock: { mode: "for_no_key_update" },
      });

      if (!team1 || !team2) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      const lockedBuyingTeam = team1.id === buyingTeam.id ? team1 : team2;
      const lockedListingTeam = team1.id === player.team.id ? team1 : team2;

      if (
        lockedBuyingTeam.players.length >= this.MAX_PLAYERS_PER_TEAM ||
        lockedListingTeam.players.length <= this.MIN_PLAYERS_PER_TEAM ||
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

      player.team = lockedBuyingTeam;
      player.isListed = false;
      player.price = null;

      await queryRunner.manager.save(lockedBuyingTeam);
      await queryRunner.manager.save(lockedListingTeam);
      await queryRunner.manager.save(player);

      await queryRunner.commitTransaction();
      return player;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
