import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  Membership,
  MembershipRole,
  MembershipStatus,
} from '../entities/membership.entity';
import { Group } from '../../groups/entities/group.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);
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
    this.logger.debug(`addMember group=${group.id} user=${user.id}`);
    try {
      const count = await this.members.count({
        group,
        status: MembershipStatus.ACCEPTED,
      });
      if (count >= group.capacity) {
        this.logger.warn('Group capacity full');
        throw new InternalServerErrorException('Group capacity full');
      }
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
      this.logger.log(`Member added ${membership.id}`);
      return membership;
    } catch (error) {
      this.logger.error('Failed to add member', error.stack);
      throw new InternalServerErrorException();
    }
  }

  async removeMember(membership: Membership): Promise<void> {
    this.logger.debug(`removeMember id=${membership.id}`);
    try {
      this.em.remove(membership);
      await this.em.flush();
      this.logger.log(`Member removed ${membership.id}`);
    } catch (error) {
      this.logger.error('Failed to remove member', error.stack);
      throw new InternalServerErrorException();
    }
  }

  async listMembers(group: Group): Promise<Membership[]> {
    this.logger.debug(`listMembers group=${group.id}`);
    try {
      const members = await this.members.find({ group });
      this.logger.log(`Found ${members.length} members`);
      return members;
    } catch (error) {
      this.logger.error('Failed to list members', error.stack);
      throw new InternalServerErrorException();
    }
  }

  async findMembership(group: Group, user: User): Promise<Membership | null> {
    return this.members.findOne({ group, user });
  }

  async findById(id: string): Promise<Membership | null> {
    return this.members.findOne({ id });
  }

  async leaveMembership(membership: Membership): Promise<void> {
    this.logger.debug(`leaveMembership id=${membership.id}`);
    try {
      membership.status = MembershipStatus.LEFT;
      await this.em.flush();
      this.logger.log(`Member left ${membership.id}`);
    } catch (error) {
      this.logger.error('Failed to leave membership', error.stack);
      throw new InternalServerErrorException();
    }
  }
}
