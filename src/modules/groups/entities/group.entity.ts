import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Timestamp } from '../../../base/timestamp.entity';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity({ tableName: 'groups' })
export class Group extends Timestamp {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id: string = uuidv4();

  @Property()
  name: string;

  @Property({ nullable: true })
  description?: string;

  @Property({ name: 'is_private', default: false })
  isPrivate = false;

  @ManyToOne(() => User)
  owner: User;

  @Property({ default: 50 })
  capacity = 50;

  @Property({ name: 'invite_code', nullable: true })
  inviteCode?: string;
}
