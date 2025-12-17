import { Processor, WorkerHost } from "@nestjs/bullmq";
import { faker } from "@faker-js/faker";
import { Job } from "bullmq";
import { TeamService } from "src/marketplace/service/team.service";
import { UserCreatedJobData } from "types/types";
import Decimal from "decimal.js";
import { DeepPartial } from "typeorm";
import { Team } from "src/marketplace/schema/team.entity";
import { Player, Position } from "src/marketplace/schema/player.entity";

@Processor("team")
export class TeamProcessor extends WorkerHost {
  private readonly STARTING_BUDGET = new Decimal(5_000_000);

  constructor(private readonly teamService: TeamService) {
    super();
  }

  async process(job: Job<UserCreatedJobData>): Promise<any> {
    if (job.name !== "userCreated") {
      return;
    }
    const { userId, email } = job.data;
    const [userNameInEmail] = email.split("@");
    const teamName = `${userNameInEmail}-${userId}`;
    const team: DeepPartial<Team> = {
      name: teamName,
      budget: this.STARTING_BUDGET,
      owner: {
        id: userId,
      },
      ownerId: userId,
    };
    const players: DeepPartial<Player>[] = [];
    for (let i = 0; i < 3; i++) {
      players.push({
        name: faker.person.fullName(),
        position: Position.GOALKEEPER,
        isListed: false,
        price: null,
      });
    }
    for (let i = 0; i < 6; i++) {
      players.push({
        name: faker.person.fullName(),
        position: Position.DEFENDER,
        isListed: false,
        price: null,
      });
    }
    for (let i = 0; i < 6; i++) {
      players.push({
        name: faker.person.fullName(),
        position: Position.MIDFIELDER,
        isListed: false,
        price: null,
      });
    }
    for (let i = 0; i < 5; i++) {
      players.push({
        name: faker.person.fullName(),
        position: Position.ATTACKER,
        isListed: false,
        price: null,
      });
    }
    await this.teamService.createTeam(team, players);
  }
}
