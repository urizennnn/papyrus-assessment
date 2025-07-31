import { Entity, Property, PrimaryKey, ManyToOne } from '@mikro-orm/core';
import { Timestamp } from '../../../base/timestamp.entity';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken extends Timestamp {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id: string = uuidv4();

  @ManyToOne(() => User)
  user: User;

  @Property({ name: 'token_hash' })
  tokenHash: string;

  @Property()
  fingerprint: string;

  @Property()
  ip: string;

  @Property({ name: 'user_agent' })
  userAgent: string;

  @Property({ default: false })
  revoked = false;

  @Property({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt: Date;
}
