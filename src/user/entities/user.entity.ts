import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { Timestamp } from '../../base/timestamp.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity({ tableName: 'users' })
export class User extends Timestamp {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id: string = uuidv4();

  @Property()
  @Unique()
  email: string;

  @Property({ hidden: true })
  password: string;

  @Property()
  name: string;
}
