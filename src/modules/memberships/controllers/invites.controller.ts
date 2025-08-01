import {
  Controller,
  Post,
  Param,
  UseGuards,
  Req,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth-guard';
import { MembershipService } from '../services/membership.service';
import { GroupService } from '../../groups/services/group.service';
import { UserService } from '../../users/services/user.service';
import { Request } from 'express';
import {
  MembershipRole,
  MembershipStatus,
} from '../entities/membership.entity';

@Controller('invites')
@UseGuards(JwtAuthGuard)
export class InvitesController {
  private readonly logger = new Logger(InvitesController.name);
  constructor(
    private readonly memberships: MembershipService,
    private readonly groups: GroupService,
    private readonly users: UserService,
  ) {}

  @Post(':code/join')
  async join(@Param('code') code: string, @Req() req: Request) {
    this.logger.debug(`join via invite ${code}`);
    try {
      const group = await this.groups.findByInviteCode(code);
      if (!group || !group.isPrivate) {
        throw new BadRequestException('Invalid invite code');
      }
      const user = await this.users.findById((req.user as any).id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const membership = await this.memberships.addMember(
        group,
        user,
        MembershipRole.MEMBER,
        MembershipStatus.ACCEPTED,
      );
      return membership;
    } catch (error) {
      this.logger.error('Join via invite failed', error.stack);
      throw error;
    }
  }
}
