import {
  Controller,
  Param,
  Post,
  Delete,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth-guard';
import { MembershipService } from '../services/membership.service';
import { GroupService } from '../../groups/services/group.service';
import { UserService } from '../../users/services/user.service';
import { Request } from 'express';

@Controller('groups/:id')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
  constructor(
    private readonly memberships: MembershipService,
    private readonly groups: GroupService,
    private readonly users: UserService,
  ) {}

  @Post('join')
  async join(@Param('id') id: string, @Req() req: Request) {
    const group = await this.groups.findOneOrFail(id);
    const user = await this.users.findById((req.user as any).id);
    return this.memberships.addMember(group, user!, undefined);
  }

  @Post('leave')
  async leave(@Param('id') id: string, @Req() req: Request) {
    return { success: true };
  }

  @Get('members')
  async members(@Param('id') id: string) {
    const group = await this.groups.findOneOrFail(id);
    return this.memberships.listMembers(group);
  }

  @Delete('members/:memberId')
  async remove(@Param('id') id: string, @Param('memberId') memberId: string) {
    return { success: true };
  }
}
