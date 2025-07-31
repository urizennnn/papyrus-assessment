import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Membership } from './entities/membership.entity';
import { MembershipService } from './services/membership.service';
import { MembershipController } from './controllers/membership.controller';
import { Group } from '../group/entities/group.entity';
import { User } from '../user/entities/user.entity';
import { GroupService } from '../group/services/group.service';
import { UserService } from '../user/services/user.service';

@Module({
  imports: [MikroOrmModule.forFeature([Membership, Group, User])],
  providers: [MembershipService, GroupService, UserService],
  controllers: [MembershipController],
})
export class MembershipModule {}
