import { Controller, Get, NotFoundException, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { User } from "src/auth/decorator/user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth-strategy.guard";
import { SafeUserObject } from "src/auth/service/auth.service";
import { Team } from "../schema/team.entity";
import { TeamService } from "../service/team.service";

@ApiTags("team")
@Controller("team")
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getTeamInfo(@User() user: SafeUserObject): Promise<Team> {
    const team = await this.teamService.getUserTeam(user.id);
    if (!team) {
      throw new NotFoundException("Team not found, generation in progress");
    }
    return team;
  }
}
