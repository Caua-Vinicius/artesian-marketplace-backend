import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUser } from 'src/auth/types/safe-user.type';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: SafeUser = request.user;
    return user;
  },
);
