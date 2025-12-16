import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/users/schema/user.entity";
import { UserService } from "src/users/service/user.service";
import * as bcrypt from "bcryptjs";

export type SafeUserObject = Omit<User, "password">;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(
    email: string,
    pw: string
  ): Promise<SafeUserObject | null> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      return this.register(email, pw);
    }
    if (bcrypt.compareSync(pw, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(
    user: SafeUserObject
  ): Promise<{ user: SafeUserObject; access_token: string }> {
    const payload = { sub: user.id.toString() };
    return {
      user,
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(email: string, pw: string): Promise<SafeUserObject> {
    const hashedPassword = bcrypt.hashSync(pw, bcrypt.genSaltSync(10));
    const newUser = await this.userService.create({
      email,
      password: hashedPassword,
    });
    const { password: _, ...result } = newUser;
    return result;
  }
}
