import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

export const GetCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestWithUser['user'] => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  }
);
