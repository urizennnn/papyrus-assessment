import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Group } from '../entities/group.entity';
import { CreateGroupDto } from '../dto/create-group.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group) private readonly groups: EntityRepository<Group>,
    private readonly em: EntityManager,
  ) {}

  async create(dto: CreateGroupDto, owner: User): Promise<Group> {
    const group = this.groups.create({ ...dto, owner });
    await this.em.persistAndFlush(group);
    return group;
  }

  async findAll(owner: User): Promise<Group[]> {
    return this.groups.find({ owner });
  }

  async findOneOrFail(id: string): Promise<Group> {
    return this.groups.findOneOrFail({ id });
  }

  async update(group: Group, payload: Partial<Group>): Promise<Group> {
    this.groups.assign(group, payload);
    await this.em.flush();
    return group;
  }

  async softDelete(group: Group): Promise<void> {
    group.deleted = true;
    group.deletedAt = new Date();
    await this.em.flush();
  }
}
