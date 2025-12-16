import { IsOptional } from "class-validator";
import { Player, Position } from "../schema/player.entity";

export class GetListedPlayersDto {
  @IsOptional()
  playerName?: string;

  @IsOptional()
  minPrice?: number;

  @IsOptional()
  maxPrice?: number;

  @IsOptional()
  teamName?: string;
}

export class GetListedPlayerResponseDto {
  id: number;
  name: string;
  position: Position;
  isListed: boolean;
  price: number;
  team: {
    id: number;
    name: string;
  };

  constructor(player: Player) {
    this.id = player.id;
    this.name = player.name;
    this.position = player.position;
    this.isListed = player.isListed;
    this.price = player.price ? player.price.toNumber() : 0;
    this.team = {
      id: player.team.id,
      name: player.team.name,
    };
  }

  static fromArray(players: Player[]): GetListedPlayerResponseDto[] {
    return players.map((player) => new GetListedPlayerResponseDto(player));
  }
}
