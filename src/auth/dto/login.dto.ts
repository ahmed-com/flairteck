import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength, IsAscii } from "class-validator";
import { SafeUserObject } from "../service/auth.service";

export class LoginDto {
  @ApiProperty({
    description: "Account Email",
    example: "john@example.com",
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Account Password",
    example: "StrongPassword123!",
  })
  @IsNotEmpty()
  @MinLength(8)
  @IsAscii()
  password: string;
}

export class LoginDtoResponse {
  email: string;
  id: number;
  accessToken: string;

  constructor(user: SafeUserObject, accessToken: string) {
    this.id = user.id;
    this.email = user.email;
    this.accessToken = accessToken;
  }
}
