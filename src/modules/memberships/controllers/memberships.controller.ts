import {
  Controller,
  Param,
  Post,
  Delete,
  Get,
  UseGuards,
  Req,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth-guard';
import { MembershipService } from '../services/membership.service';
import { GroupService } from '../../groups/services/group.service';
import { UserService } from '../../users/services/user.service';
import { Request } from 'express';

@Controller('groups/:id')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
  private readonly logger = new Logger(MembershipsController.name);
  constructor(
    private readonly memberships: MembershipService,
    private readonly groups: GroupService,
    private readonly users: UserService,
  ) {}

  @Post('join')
  async join(@Param('id') id: string, @Req() req: Request) {
    this.logger.debug(`join group=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      const user = await this.users.findById((req.user as any).id);
      const result = await this.memberships.addMember(group, user!, undefined);
      this.logger.log(`Join request processed for user ${user!.id}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to join group', error.stack);
      throw new InternalServerErrorException();
    }
  }

  @Post('leave')
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
      throw new InternalServerErrorException();
    }
  }

  @Get('members')
  async members(@Param('id') id: string) {
    this.logger.debug(`members group=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      return await this.memberships.listMembers(group);
    } catch (error) {
      this.logger.error('Failed to list members', error.stack);
      throw new InternalServerErrorException();
    }
  }

  @Delete('members/:memberId')
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
      throw new InternalServerErrorException();
    }
  }
}
