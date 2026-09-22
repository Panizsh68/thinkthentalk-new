import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtPayload } from '../../auth/jwt.strategy';

@Injectable()
export class UserJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtPayload>(
    err: unknown,
    user: TUser | undefined,
  ): TUser {
    if (err || !user || (user as unknown as JwtPayload).type !== 'USER') {
      throw new UnauthorizedException('A user account is required');
    }
    return user;
  }
}
