import {
  Body,
  Controller,
  Get,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth-guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request): Promise<User | null> {
    return this.users.findById((req.user as any).id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async update(
    @Req() req: Request,
    @Body() dto: UpdateUserDto,
  ): Promise<User | null> {
    const user = await this.users.findById((req.user as any).id);
    if (!user) return null;
    return this.users.update(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async remove(@Req() req: Request) {
    const user = await this.users.findById((req.user as any).id);
    if (user) await this.users.softDelete(user);
    return { success: true };
  }
}
