import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Enum,
  Unique,
} from '@mikro-orm/core';
import { Timestamp } from '../../../base/timestamp.entity';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';
import { v4 as uuidv4 } from 'uuid';

export enum MembershipRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum MembershipStatus {
  INVITED = 'invited',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  LEFT = 'left',
}

@Entity({ tableName: 'memberships' })
@Unique({ name: 'uq_membership_group_user', properties: ['group', 'user'] })
export class Membership extends Timestamp {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id: string = uuidv4();

  @ManyToOne(() => Group)
  group: Group;

  @ManyToOne(() => User)
  user: User;

  @Enum(() => MembershipRole)
  role: MembershipRole = MembershipRole.MEMBER;

  @Enum(() => MembershipStatus)
  status: MembershipStatus = MembershipStatus.INVITED;
}
