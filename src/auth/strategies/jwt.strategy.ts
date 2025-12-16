import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserService } from "src/users/service/user.service";
import { SafeUserObject } from "../service/auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private config: ConfigService;

  constructor(
    config: ConfigService,
    private userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET") || "defaultSecret",
      algorithms: ["HS256"],
    });
    this.config = config;
  }

  async validate(payload: { sub: string }): Promise<SafeUserObject | null> {
    const userId = parseInt(payload.sub, 10);
    const user = await this.userService.findOne(userId);
    if (!user) {
      return null;
    }
    const { password: _, ...result } = user;
    return result;
  }
}
