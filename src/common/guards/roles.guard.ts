import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { JwtUser } from '../../auth/interfaces/jwt-user.interface';

@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: any): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
