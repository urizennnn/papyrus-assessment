import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Group } from './entities/group.entity';
import { GroupService } from './services/group.service';
import { GroupController } from './controllers/group.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Group])],
  providers: [GroupService],
  controllers: [GroupController],
  exports: [GroupService],
})
export class GroupModule {}
