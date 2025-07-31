import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth-guard';
import { GroupService } from '../services/group.service';
import { CreateGroupDto } from '../dto/create-group.dto';
import { Request } from 'express';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
  constructor(private readonly groups: GroupService) {}

  @Post()
  async create(@Body() dto: CreateGroupDto, @Req() req: Request) {
    return this.groups.create(dto, req.user as any);
  }

  @Get()
  async list(@Req() req: Request) {
    return this.groups.findAll(req.user as any);
  }
}
