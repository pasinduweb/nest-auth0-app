import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    if (!user) {
      return false;
    }

    const rolesClaimKey = process.env.AUTH0_ROLES_CLAIM;
    if (!rolesClaimKey) {
      console.warn('AUTH0_ROLES_CLAIM environment variable is not set');
      return false;
    }

    const userRoles = user[rolesClaimKey] || [];

    // Check if user roles intersect with required roles
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
