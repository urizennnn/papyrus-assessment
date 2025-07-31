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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth-guard';
import { GroupService } from '../services/group.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { Request } from 'express';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groups: GroupService) {}

  @Post()
  async create(@Body() dto: CreateGroupDto, @Req() req: Request) {
    return this.groups.create(dto, req.user as any);
  }

  @Get()
  async list(@Req() req: Request) {
    return this.groups.findAll(req.user as any);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.groups.findOneOrFail(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const group = await this.groups.findOneOrFail(id);
    return this.groups.update(group, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const group = await this.groups.findOneOrFail(id);
    await this.groups.softDelete(group);
    return { success: true };
  }
}
