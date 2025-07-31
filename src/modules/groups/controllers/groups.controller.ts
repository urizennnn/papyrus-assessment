import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth-guard';
import { GroupService } from '../services/group.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { Request } from 'express';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  private readonly logger = new Logger(GroupsController.name);
  constructor(private readonly groups: GroupService) {}

  @Post()
  async create(@Body() dto: CreateGroupDto, @Req() req: Request) {
    this.logger.debug(`create group`);
    try {
      return await this.groups.create(dto, req.user as any);
    } catch (error) {
      this.logger.error('Create group failed', error.stack);
      throw error;
    }
  }

  @Get()
  async list(@Req() req: Request) {
    this.logger.debug('list groups');
    try {
      return await this.groups.findAll(req.user as any);
    } catch (error) {
      this.logger.error('List groups failed', error.stack);
      throw error;
    }
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    this.logger.debug(`detail id=${id}`);
    try {
      return await this.groups.findOneOrFail(id);
    } catch (error) {
      this.logger.error(`Get group ${id} failed`, error.stack);
      throw error;
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    this.logger.debug(`update id=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      return await this.groups.update(group, dto);
    } catch (error) {
      this.logger.error(`Update group ${id} failed`, error.stack);
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.debug(`remove id=${id}`);
    try {
      const group = await this.groups.findOneOrFail(id);
      await this.groups.softDelete(group);
      this.logger.log(`Group removed ${id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Remove group ${id} failed`, error.stack);
      throw error;
    }
  }

  @Get('search')
  async search(@Req() req: Request) {
    this.logger.debug('search groups');
    try {
      const query = req.query.q as string;
      return await this.groups.search(query, req.user as any);
    } catch (error) {
      this.logger.error('Search groups failed', error.stack);
      throw error;
    }
  }
}
