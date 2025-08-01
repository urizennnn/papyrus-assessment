import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  HttpException,
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
    status: MembershipStatus = MembershipStatus.ACCEPTED,
  ): Promise<Membership> {
    this.logger.debug(`addMember group=${group.id} user=${user.id}`);
    try {
      if (
        group.memberCount >= group.capacity &&
        status === MembershipStatus.ACCEPTED
      ) {
        this.logger.warn('Group capacity full');
        throw new BadRequestException('Group capacity full');
      }

      const existing = await this.members.findOne({
        user,
        status: {
          $in: [
            MembershipStatus.ACCEPTED,
            MembershipStatus.PENDING,
            MembershipStatus.INVITED,
          ],
        },
      });
      if (existing && existing.group.id !== group.id) {
        throw new BadRequestException('User already in a group');
      }
      let membership = await this.members.findOne({ group, user });
      if (!membership) {
        membership = this.members.create({
          group,
          user,
          role,
          status,
        });
        if (status === MembershipStatus.ACCEPTED) {
          group.memberCount++;
        }
      } else {
        const prevStatus = membership.status;
        membership.status = status;
        membership.role = role;
        if (
          prevStatus !== MembershipStatus.ACCEPTED &&
          status === MembershipStatus.ACCEPTED
        ) {
          group.memberCount++;
        }
      }
      await this.em.persistAndFlush(membership);
      this.logger.log(`Member added ${membership.id}`);
      return membership;
    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.warn('Bad request while adding member', error.message);
        throw error;
      }
      this.logger.error('Failed to add member', error.stack);
      throw new InternalServerErrorException('Failed to add member');
    }
  }

  async inviteMember(
    group: Group,
    user: User,
    role = MembershipRole.MEMBER,
  ): Promise<Membership> {
    return this.addMember(group, user, role, MembershipStatus.INVITED);
  }

  async removeMember(membership: Membership): Promise<void> {
    this.logger.debug(`removeMember id=${membership.id}`);
    try {
      if (membership.status === MembershipStatus.ACCEPTED) {
        membership.group.memberCount--;
      }
      this.em.remove(membership);
      await this.em.flush();
      this.logger.log(`Member removed ${membership.id}`);
    } catch (error) {
      this.logger.error('Failed to remove member', error.stack);
      throw new InternalServerErrorException('Failed to remove member');
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
      throw new InternalServerErrorException('Failed to list members');
    }
  }

  async listPending(group: Group): Promise<Membership[]> {
    return this.members.find({ group, status: MembershipStatus.PENDING });
  }

  async approveRequest(membership: Membership): Promise<Membership> {
    if (membership.status !== MembershipStatus.ACCEPTED) {
      if (membership.group.memberCount >= membership.group.capacity) {
        throw new BadRequestException('Group is full');
      }
      membership.status = MembershipStatus.ACCEPTED;
      membership.group.memberCount++;
      await this.em.flush();
    }
    return membership;
  }

  async rejectRequest(membership: Membership): Promise<void> {
    if (membership.status === MembershipStatus.ACCEPTED) {
      membership.group.memberCount--;
    }
    membership.status = MembershipStatus.DECLINED;
    await this.em.flush();
  }

  async findMembership(group: Group, user: User): Promise<Membership | null> {
    return this.members.findOne({ group, user });
  }

  async findMembershipByIds(
    groupId: string,
    userId: string,
  ): Promise<Membership | null> {
    return this.members.findOne({
      group: groupId,
      user: userId,
    });
  }

  async findById(id: string): Promise<Membership | null> {
    return this.members.findOne({ id });
  }

  async leaveMembership(membership: Membership): Promise<void> {
    this.logger.debug(`leaveMembership id=${membership.id}`);
    try {
      if (membership.status === MembershipStatus.ACCEPTED) {
        membership.group.memberCount--;
      }
      membership.status = MembershipStatus.LEFT;
      await this.em.flush();
      this.logger.log(`Member left ${membership.id}`);
    } catch (error) {
      this.logger.error('Failed to leave membership', error.stack);
      throw new InternalServerErrorException('Failed to leave membership');
    }
  }
}
