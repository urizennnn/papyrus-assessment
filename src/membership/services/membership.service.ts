import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  Membership,
  MembershipRole,
  MembershipStatus,
} from '../entities/membership.entity';
import { Group } from '../../group/entities/group.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(Membership)
    private readonly members: EntityRepository<Membership>,
    private readonly em: EntityManager,
  ) {}

  async addMember(
    group: Group,
    user: User,
    role = MembershipRole.MEMBER,
  ): Promise<Membership> {
    let membership = await this.members.findOne({ group, user });
    if (!membership) {
      membership = this.members.create({
        group,
        user,
        role,
        status: MembershipStatus.ACCEPTED,
      });
    } else {
      membership.status = MembershipStatus.ACCEPTED;
      membership.role = role;
    }
    await this.em.persistAndFlush(membership);
    return membership;
  }
}
