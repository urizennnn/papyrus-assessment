import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    this.logger.debug(`create user ${dto.email}`);
    try {
      const password = await bcrypt.hash(dto.password, 10);
      const user = this.userRepo.create({ ...dto, password });
      await this.em.persistAndFlush(user);
      this.logger.log(`User created ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`findByEmail ${email}`);
    try {
      return await this.userRepo.findOne({ email });
    } catch (error) {
      this.logger.error('Failed to find by email', error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findById(id: string): Promise<User | null> {
    this.logger.debug(`findById ${id}`);
    try {
      return await this.userRepo.findOne({ id });
    } catch (error) {
      this.logger.error('Failed to find by id', error.stack);
      throw new InternalServerErrorException();
    }
  }

  async update(user: User, payload: Partial<User>): Promise<User> {
    this.logger.debug(`update ${user.id}`);
    try {
      this.userRepo.assign(user, payload);
      await this.em.flush();
      this.logger.log(`User updated ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to update user', error.stack);
      throw new InternalServerErrorException();
    }
  }

  async softDelete(user: User): Promise<void> {
    this.logger.debug(`softDelete ${user.id}`);
    try {
      user.deleted = true;
      user.deletedAt = new Date();
      await this.em.flush();
      this.logger.log(`User deleted ${user.id}`);
    } catch (error) {
      this.logger.error('Failed to delete user', error.stack);
      throw new InternalServerErrorException();
    }
  }
}
