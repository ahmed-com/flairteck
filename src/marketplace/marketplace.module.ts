import { Module } from "@nestjs/common";
import { TeamService } from "./service/team.service";
import { PlayerService } from "./service/player.service";
import { PlayerController } from "./controller/player.controller";
import { TeamController } from "./controller/team.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Team } from "./schema/team.entity";
import { Player } from "./schema/player.entity";
import { MarketController } from "./controller/market.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Team, Player])],
  providers: [TeamService, PlayerService],
  controllers: [PlayerController, TeamController, MarketController],
  exports: [TeamService],
})
export class MarketplaceModule {}
