import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Player } from "../schema/player.entity";
import { Team } from "../schema/team.entity";
import { GetListedPlayersDto } from "../dto/getListedPlayers.dto";
import { ListPlayerDto } from "../dto/listPlayer.dto";
import { SafeUserObject } from "src/auth/service/auth.service";

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly dataSource: DataSource
  ) {}

  async getListedPlayers(query: GetListedPlayersDto): Promise<Player[]> {
    const qb = this.playerRepository.createQueryBuilder("player");

    qb.leftJoinAndSelect("player.team", "team");
    qb.where("player.isListed = :isListed", { isListed: true });

    if (query.playerName) {
      qb.andWhere("player.name ILIKE :playerName", {
        playerName: `%${query.playerName}%`,
      });
    }

    if (query.minPrice) {
      qb.andWhere("player.price >= :minPrice", { minPrice: query.minPrice });
    }

    if (query.maxPrice) {
      qb.andWhere("player.price <= :maxPrice", { maxPrice: query.maxPrice });
    }

    if (query.teamName) {
      qb.andWhere("team.name ILIKE :teamName", {
        teamName: `%${query.teamName}%`,
      });
    }

    return qb.getMany();
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
    if (player.team.owner.id !== user.id) {
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
    if (player.team.owner.id !== user.id) {
      return null;
    }
    player.isListed = false;
    player.price = null;
    return this.playerRepository.save(player);
  }

  async findOne(id: number): Promise<Player | null> {
    return this.playerRepository.findOneBy({ id });
  }

  async buyPlayer(user: SafeUserObject, id: number): Promise<Player | null> {
    const player = await this.playerRepository.findOne({
      where: { id },
      relations: ["team", "team.owner"],
    });

    if (!player || !player.isListed) {
      return null;
    }

    if (player.team.owner.id === user.id) {
      return null;
    }

    const buyingTeam = await this.teamRepository.findOne({
      where: { owner: { id: user.id } },
    });

    if (!buyingTeam) {
      return null;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const teamIds = [buyingTeam.id, player.team.id].sort((a, b) => a - b);

      const lockedPlayer = await queryRunner.manager.findOne(Player, {
        where: { id: player.id },
        lock: { mode: "pessimistic_write" },
        relations: ["team"],
      });

      if (!lockedPlayer || !lockedPlayer.isListed) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      const team1 = await queryRunner.manager.findOne(Team, {
        where: { id: teamIds[0] },
        lock: { mode: "pessimistic_write" },
        relations: ["players"],
      });

      const team2 = await queryRunner.manager.findOne(Team, {
        where: { id: teamIds[1] },
        lock: { mode: "pessimistic_write" },
        relations: ["players"],
      });

      if (!team1 || !team2) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      const lockedBuyingTeam = team1.id === buyingTeam.id ? team1 : team2;
      const lockedListingTeam = team1.id === player.team.id ? team1 : team2;

      if (lockedBuyingTeam.players.length >= 25) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      if (lockedListingTeam.players.length <= 15) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      if (!lockedPlayer.price) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      if (lockedBuyingTeam.budget.lessThan(lockedPlayer.price)) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      lockedBuyingTeam.budget = lockedBuyingTeam.budget.minus(
        lockedPlayer.price
      );
      lockedListingTeam.budget = lockedListingTeam.budget.plus(
        lockedPlayer.price
      );

      lockedPlayer.team = lockedBuyingTeam;
      lockedPlayer.isListed = false;
      lockedPlayer.price = null;

      await queryRunner.manager.save(lockedBuyingTeam);
      await queryRunner.manager.save(lockedListingTeam);
      await queryRunner.manager.save(lockedPlayer);

      await queryRunner.commitTransaction();
      return lockedPlayer;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
