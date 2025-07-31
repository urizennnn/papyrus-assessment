import {
  Body,
  Controller,
  Get,
  Patch,
  Delete,
  UseGuards,
  Req,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth-guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly users: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request): Promise<User | null> {
    this.logger.debug('me');
    try {
      return await this.users.findById((req.user as any).id);
    } catch (error) {
      this.logger.error('Failed to load profile', error.stack);
      throw new InternalServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async update(
    @Req() req: Request,
    @Body() dto: UpdateUserDto,
  ): Promise<User | null> {
    this.logger.debug('update me');
    try {
      const user = await this.users.findById((req.user as any).id);
      if (!user) return null;
      return await this.users.update(user, dto);
    } catch (error) {
      this.logger.error('Failed to update user', error.stack);
      throw new InternalServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async remove(@Req() req: Request) {
    this.logger.debug('remove me');
    try {
      const user = await this.users.findById((req.user as any).id);
      if (user) await this.users.softDelete(user);
      this.logger.log(`User removed ${(req.user as any).id}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to delete user', error.stack);
      throw new InternalServerErrorException();
    }
  }
}
