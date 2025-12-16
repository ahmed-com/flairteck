import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PlayerService } from "../service/player.service";

@ApiTags("player")
@Controller("player")
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}
}
