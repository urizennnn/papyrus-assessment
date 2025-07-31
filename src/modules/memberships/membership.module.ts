import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Membership } from './entities/membership.entity';
import { MembershipService } from './services/membership.service';
import { MembershipsController } from './controllers/memberships.controller';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { GroupService } from '../groups/services/group.service';
import { UserService } from '../users/services/user.service';

@Module({
  imports: [MikroOrmModule.forFeature([Membership, Group, User])],
  providers: [MembershipService, GroupService, UserService],
  controllers: [MembershipsController],
})
export class MembershipModule {}
