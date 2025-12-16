import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeepPartial, Repository } from "typeorm";
import { Team } from "../schema/team.entity";
import { Player } from "../schema/player.entity";

@Injectable()
export class TeamService {
  constructor(
    private readonly datasource: DataSource,
    @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>
  ) {}

  async getUserTeam(userId: number): Promise<Team | null> {
    return this.teamRepository.findOneBy({ owner: { id: userId } });
  }

  async createTeam(
    team: DeepPartial<Team>,
    players: DeepPartial<Player>[] = []
  ): Promise<Team> {
    const qr = this.datasource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const newTeam = this.teamRepository.create(team);
      const savedTeam = await qr.manager.save(newTeam);
      for (const player of players) {
        player.team = savedTeam;
        const newPlayer = this.playerRepository.create(player);
        await qr.manager.save(newPlayer);
      }
      await qr.commitTransaction();
      return savedTeam;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
}
