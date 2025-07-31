import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Group } from './entities/group.entity';
import { GroupService } from './services/group.service';
import { GroupsController } from './controllers/groups.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Group])],
  providers: [GroupService],
  controllers: [GroupsController],
  exports: [GroupService],
})
export class GroupsModule {}
