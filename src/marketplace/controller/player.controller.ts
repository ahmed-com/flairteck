import {
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PlayerService } from "../service/player.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth-strategy.guard";
import { User } from "src/auth/decorator/user.decorator";
import { SafeUserObject } from "src/auth/service/auth.service";
import { BuyPlayerDto } from "../dto/buyPlayer.dto";

@ApiTags("player")
@Controller("player")
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @UseGuards(JwtAuthGuard)
  @Post("buy")
  async buyPlayer(
    @User() user: SafeUserObject,
    @Body() buyPlayerDto: BuyPlayerDto
  ) {
    const player = await this.playerService.buyPlayer(user, buyPlayerDto);
    if (!player) {
      throw new NotFoundException(
        "Player not found, not listed, insufficient funds, or invalid offer"
      );
    }
    return player;
  }
}
