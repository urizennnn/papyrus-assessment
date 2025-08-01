import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Membership } from './entities/membership.entity';
import { MembershipService } from './services/membership.service';
import { MembershipsController } from './controllers/memberships.controller';
import { InvitesController } from './controllers/invites.controller';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupService } from '../groups/services/group.service';
import { UserService } from '../users/services/user.service';
import { EmailService } from '../../lib/email.service';
import { GroupRoleGuard } from '../../guards/group-role.guard';

@Module({
  imports: [MikroOrmModule.forFeature([Membership, Group, User])],
  providers: [
    MembershipService,
    GroupService,
    UserService,
    EmailService,
    GroupRoleGuard,
  ],
  controllers: [MembershipsController, InvitesController],
})
export class MembershipModule {}
