import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { SafeUserObject } from "../service/auth.service";

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: SafeUserObject }>();
    return request.user;
  }
);
