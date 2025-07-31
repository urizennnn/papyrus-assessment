import { MikroORM } from '@mikro-orm/postgresql';
import mikroConfig from './mikro-orm.config';
import { User } from './user/entities/user.entity';
import { Group } from './group/entities/group.entity';
import {
  Membership,
  MembershipRole,
  MembershipStatus,
} from './membership/entities/membership.entity';

async function run() {
  const orm = await MikroORM.init(mikroConfig);
  const em = orm.em.fork();

  const user = em.create(User, {
    email: 'admin@example.com',
    password: 'password',
    name: 'Admin',
  });
  const group = em.create(Group, { name: 'Public Group', owner: user });
  const membership = em.create(Membership, {
    group,
    user,
    role: MembershipRole.ADMIN,
    status: MembershipStatus.ACCEPTED,
  });

  await em.persistAndFlush([user, group, membership]);
  await orm.close();
}

run();
