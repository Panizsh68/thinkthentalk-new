import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      this.logger.warn('Access denied: unauthenticated');
      return false;
    }

    // When no explicit roles are specified, ensure the requester is an admin token.
    if (!requiredRoles || requiredRoles.length === 0) {
      return user.type === 'ADMIN';
    }

    if (user.type !== 'ADMIN') {
      this.logger.warn('Access denied: non-admin token');
      return false;
    }

    if (!user.role) {
      this.logger.warn('Access denied: admin role missing');
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
