import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { Transform } from "class-transformer";
import Decimal from "decimal.js";

@ValidatorConstraint({ name: "isDecimalPositive", async: false })
export class IsDecimalPositive implements ValidatorConstraintInterface {
  validate(value: any, _: ValidationArguments) {
    if (value instanceof Decimal) {
      return value.greaterThan(0);
    }
    return false;
  }

  defaultMessage(_: ValidationArguments) {
    return "Money must be a positive number";
  }
}

export function TransformToDecimal() {
  return Transform(({ value }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return new Decimal(value);
    } catch (_) {
      return undefined;
    }
  });
}

export class ListPlayerDto {
  @ApiProperty({
    description: "Player ID",
    example: 42,
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: "Listing Price",
    example: "1000000",
    type: String,
  })
  @IsNotEmpty()
  @TransformToDecimal()
  @Validate(IsDecimalPositive)
  price: Decimal;
}
