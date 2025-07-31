import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const password = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password });
    await this.em.persistAndFlush(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ id });
  }

  async update(user: User, payload: Partial<User>): Promise<User> {
    this.userRepo.assign(user, payload);
    await this.em.flush();
    return user;
  }

  async softDelete(user: User): Promise<void> {
    user.deleted = true;
    user.deletedAt = new Date();
    await this.em.flush();
  }
}
