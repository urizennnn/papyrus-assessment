import {
  Controller,
  Param,
  Post,
  Delete,
  Get,
  Body,
  UseGuards,
  Req,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth-guard';
import { GroupRoleGuard } from '../../../guards/group-role.guard';
import {
  GroupAdmin,
  GroupMember,
} from '../../../decorators/group-roles.decorator';
import { MembershipService } from '../services/membership.service';
import { GroupService } from '../../groups/services/group.service';
import { UserService } from '../../users/services/user.service';
import {
  MembershipStatus,
  MembershipRole,
} from '../entities/membership.entity';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { Request } from 'express';
import { EmailService } from '../../../lib/email.service';
import { TransformationType } from 'class-transformer';

@Controller('groups/:id')
@UseGuards(JwtAuthGuard, GroupRoleGuard)
export class MembershipsController {
  private readonly logger = new Logger(MembershipsController.name);
  constructor(
    private readonly memberships: MembershipService,
    private readonly groups: GroupService,
    private readonly users: UserService,
    private readonly emails: EmailService,
  ) {}

  @Post('join')
  async join(@Param('id') id: string, @Req() req: Request) {
    this.logger.debug(`join group=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      if (group.isPrivate) {
        this.logger.warn(`Attempt to join private group ${id}`);
        throw new BadRequestException('Group is private');
      }
      const user = await this.users.findById((req.user as any).id);
      const membership = await this.memberships.findMembership(group, user!);
      if (membership) {
        this.logger.warn(`User ${user!.id} already a member of group ${id}`);
        throw new BadRequestException('Already a member');
      }
      const result = await this.memberships.addMember(
        group,
        user!,
        undefined,
        MembershipStatus.PENDING,
      );
      this.logger.log(`Join request created for user ${user!.id}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to join group', error.stack);
      throw error;
    }
  }

  @Post('leave')
  @GroupMember()
  async leave(@Param('id') id: string, @Req() req: Request) {
    this.logger.debug(`leave group=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      const user = await this.users.findById((req.user as any).id);
      const membership = await this.memberships.findMembership(group, user!);
      if (membership) {
        await this.memberships.leaveMembership(membership);
      }
      this.logger.log(`User ${user?.id} left group ${id}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to leave group', error.stack);
      throw error;
    }
  }

  @Get('members')
  @GroupAdmin()
  async members(@Param('id') id: string) {
    this.logger.debug(`members group=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      return await this.memberships.listMembers(group);
    } catch (error) {
      this.logger.error('Failed to list members', error.stack);
      throw error;
    }
  }

  @Post('invite')
  @GroupAdmin()
  async invite(@Param('id') id: string, @Body() dto: InviteMemberDto) {
    this.logger.debug(`invite ${dto.email} to group=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      if (!group.isPrivate) {
        throw new BadRequestException('Group must be private');
      }
      const user = await this.users.findByEmail(dto.email);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const membership = await this.memberships.inviteMember(
        group,
        user,
        dto.role ?? MembershipRole.MEMBER,
      );
      await this.emails.sendInviteEmail(
        dto.email,
        group.name,
        group.inviteCode!,
      );
      return membership;
    } catch (error) {
      this.logger.error('Failed to invite member', error.stack);
      throw error;
    }
  }

  @Get('requests')
  @GroupAdmin()
  async requests(@Param('id') id: string) {
    const group = await this.groups.findOneOrFail(id);
    return this.memberships.listPending(group);
  }

  @Post('requests/:memberId/approve')
  @GroupAdmin()
  async approve(@Param('id') id: string, @Param('memberId') memberId: string) {
    try {
      const group = await this.groups.findOneOrFail(id);
      const membership = await this.memberships.findById(memberId);
      if (membership && membership.group.id === group.id) {
        return this.memberships.approveRequest(membership);
      }
    } catch (error) {
      this.logger.error('Failed to approve request', error.stack);
      throw error;
    }
  }

  @Post('requests/:memberId/reject')
  @GroupAdmin()
  async reject(@Param('id') id: string, @Param('memberId') memberId: string) {
    try {
      const group = await this.groups.findOneOrFail(id);
      const membership = await this.memberships.findById(memberId);
      if (membership && membership.group.id === group.id) {
        await this.memberships.rejectRequest(membership);
        return { success: true };
      }
    } catch (error) {
      this.logger.error('Failed to reject request', error.stack);
      throw error;
    }
  }

  @Delete('members/:memberId')
  @GroupAdmin()
  async remove(@Param('id') id: string, @Param('memberId') memberId: string) {
    this.logger.debug(`remove member=${memberId} from group=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      const membership = await this.memberships.findById(memberId);
      if (membership && membership.group.id === group.id) {
        await this.memberships.removeMember(membership);
      }
      this.logger.log(`Removed member ${memberId} from group ${id}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to remove member', error.stack);
      throw error;
    }
  }
}
