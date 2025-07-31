import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.users.create(dto);
  }
}
