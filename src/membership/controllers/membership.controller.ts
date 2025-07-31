import { Controller, Param, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth-guard';
import { MembershipService } from '../services/membership.service';
import { GroupService } from '../../group/services/group.service';
import { UserService } from '../../user/services/user.service';
import { Request } from 'express';

@Controller('groups/:groupId/memberships')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(
    private readonly memberships: MembershipService,
    private readonly groups: GroupService,
    private readonly users: UserService,
  ) {}

  @Post(':userId')
  async add(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const group = await this.groups.findOneOrFail(groupId);
    const user = await this.users.findByEmail(userId);
    return this.memberships.addMember(group, user!, undefined);
  }
}
