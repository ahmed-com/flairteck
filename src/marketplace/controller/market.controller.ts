import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PlayerService } from "../service/player.service";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth-strategy.guard";
import {
  GetListedPlayersDto,
  GetListedPlayerResponseDto,
} from "../dto/getListedPlayers.dto";
import { ListPlayerDto } from "../dto/listPlayer.dto";
import { User } from "src/auth/decorator/user.decorator";
import { SafeUserObject } from "src/auth/service/auth.service";

@ApiTags("market")
@Controller("market")
export class MarketController {
  constructor(private readonly playerService: PlayerService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getListedPlayers(
    @Query() query: GetListedPlayersDto
  ): Promise<GetListedPlayerResponseDto[]> {
    const players = await this.playerService.getListedPlayers(query);
    return GetListedPlayerResponseDto.fromArray(players);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async listPlayer(
    @User() user: SafeUserObject,
    @Body() listPlayerDto: ListPlayerDto
  ) {
    const player = await this.playerService.listPlayer(user, listPlayerDto);
    if (!player) {
      throw new NotFoundException(
        "Player not found or you do not have permission to list this player"
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async delistPlayer(@User() user: SafeUserObject, @Param("id") id: number) {
    const player = await this.playerService.delistPlayer(user, id);
    if (!player) {
      throw new NotFoundException(
        "Player not found or you do not have permission to delist this player"
      );
    }
  }
}
