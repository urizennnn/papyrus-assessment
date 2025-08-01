import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Group } from './entities/group.entity';
import { GroupService } from './services/group.service';
import { GroupsController } from './controllers/groups.controller';
import { Membership } from '../memberships/entities/membership.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Group, Membership])],
  providers: [GroupService],
  controllers: [GroupsController],
  exports: [GroupService],
})
export class GroupsModule {}
