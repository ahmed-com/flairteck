import { Controller, Post, UseGuards } from "@nestjs/common";
import { LocalAuthGuard } from "../guards/local-auth-strategy.guard";
import { AuthService, SafeUserObject } from "../service/auth.service";
import { ApiTags } from "@nestjs/swagger";
import { LoginDtoResponse } from "../dto/login.dto";
import { User } from "../decorator/user.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@User() user: SafeUserObject): Promise<LoginDtoResponse> {
    const res = await this.authService.login(user);
    return new LoginDtoResponse(res.user, res.access_token);
  }
}
