import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, Validate } from "class-validator";
import { IsDecimalPositive, TransformToDecimal } from "./listPlayer.dto";
import { Decimal } from "decimal.js";

export class BuyPlayerDto {
  @ApiProperty({
    description: "Player ID",
    example: 42,
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: "Price offered to buy the player",
    example: "1500000",
    type: String,
  })
  @IsNotEmpty()
  @TransformToDecimal()
  @Validate(IsDecimalPositive)
  price: Decimal;
}
