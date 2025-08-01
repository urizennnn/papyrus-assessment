import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { customAlphabet } from 'nanoid';
import { Group } from '../entities/group.entity';
import { CreateGroupDto } from '../dto/create-group.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  private readonly codeGen = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    6,
  );

  constructor(
    @InjectRepository(Group) private readonly groups: EntityRepository<Group>,
    private readonly em: EntityManager,
  ) {}

  private async generateInviteCode(): Promise<string> {
    let code: string;
    do {
      code = this.codeGen();
    } while ((await this.groups.count({ inviteCode: code })) > 0);
    return code;
  }

  async create(dto: CreateGroupDto, owner: User): Promise<Group> {
    this.logger.debug(`create dto=${JSON.stringify(dto)}`);
    try {
      const group = this.groups.create({
        ...dto,
        capacity: dto.capacity ?? 50,
        owner,
      });
      if (group.isPrivate && !group.inviteCode) {
        group.inviteCode = await this.generateInviteCode();
      }
      await this.em.persistAndFlush(group);
      this.logger.log(`Group created ${group.id}`);
      return group;
    } catch (error) {
      this.logger.error('Failed to create group', error.stack);
      throw new InternalServerErrorException('Failed to create group');
    }
  }

  async findByInviteCode(code: string): Promise<Group | null> {
    return this.groups.findOne({ inviteCode: code, deleted: false });
  }

  async findAll(owner: User): Promise<Group[]> {
    this.logger.debug(`findAll owner=${owner.id}`);
    try {
      const groups = await this.groups.find({ owner, deleted: false });
      this.logger.log(`Found ${groups.length} groups`);
      return groups;
    } catch (error) {
      this.logger.error('Failed to list groups', error.stack);
      throw new InternalServerErrorException('Failed to list groups');
    }
  }

  async findOneOrFail(id: string): Promise<Group> {
    this.logger.debug(`findOneOrFail id=${id}`);
    try {
      return await this.groups.findOneOrFail({ id, deleted: false });
    } catch (error) {
      this.logger.error(`Failed to find group ${id}`, error.stack);
      throw error;
    }
  }

  async update(group: Group, payload: Partial<Group>): Promise<Group> {
    this.logger.debug(`update id=${group.id}`);
    try {
      this.groups.assign(group, payload);
      await this.em.flush();
      this.logger.log(`Group updated ${group.id}`);
      return group;
    } catch (error) {
      this.logger.error(`Failed to update group ${group.id}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to update group ${group.id}`,
      );
    }
  }

  async softDelete(group: Group): Promise<void> {
    this.logger.debug(`softDelete id=${group.id}`);
    try {
      group.deleted = true;
      group.deletedAt = new Date();
      await this.em.flush();
      this.logger.log(`Group soft deleted ${group.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete group ${group.id}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to delete group ${group.id}`,
      );
    }
  }

  async search(query: string): Promise<Group[]> {
    this.logger.debug(`search query=${query}`);
    try {
      const groups = await this.groups.find(
        {
          name: { $like: `%${query}%` },
          isPrivate: false,
          deleted: false,
        },
        { limit: 20 },
      );
      this.logger.log(`Found ${groups.length} groups for query "${query}"`);
      return groups;
    } catch (error) {
      this.logger.error('Failed to search groups', error.stack);
      throw new InternalServerErrorException('Failed to search groups');
    }
  }
}
