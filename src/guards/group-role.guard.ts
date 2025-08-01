import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipService } from '../modules/memberships/services/membership.service';
import {
  MembershipRole,
  MembershipStatus,
} from '../modules/memberships/entities/membership.entity';
import { GROUP_ROLE_KEY } from '../decorators/group-roles.decorator';

@Injectable()
export class GroupRoleGuard implements CanActivate {
  constructor(
    private readonly memberships: MembershipService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.get<string>(
      GROUP_ROLE_KEY,
      context.getHandler(),
    );
    if (!requiredRole) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as any;
    const groupId = request.params.id;
    if (!user || !groupId) {
      return false;
    }
    const membership = await this.memberships.findMembershipByIds(
      groupId,
      user.id,
    );
    if (!membership || membership.status !== MembershipStatus.ACCEPTED) {
      return false;
    }
    if (requiredRole === 'admin') {
      return membership.role === MembershipRole.ADMIN;
    }
    return true;
  }
}
