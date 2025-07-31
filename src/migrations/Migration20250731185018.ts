import { Migration } from '@mikro-orm/migrations';

export class Migration20250731185018 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "users" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "deleted_at" timestamptz null, "deleted" boolean not null default false, "email" varchar(255) not null, "password" varchar(255) not null, "name" varchar(255) not null, constraint "users_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "users" add constraint "users_email_unique" unique ("email");`,
    );

    this.addSql(
      `create table "groups" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "deleted_at" timestamptz null, "deleted" boolean not null default false, "name" varchar(255) not null, "description" varchar(255) null, "is_private" boolean not null default false, "owner_id" uuid not null, constraint "groups_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "memberships" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "deleted_at" timestamptz null, "deleted" boolean not null default false, "group_id" uuid not null, "user_id" uuid not null, "role" text check ("role" in ('admin', 'member')) not null default 'member', "status" text check ("status" in ('invited', 'accepted', 'declined', 'left')) not null default 'invited', constraint "memberships_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "memberships" add constraint "uq_membership_group_user" unique ("group_id", "user_id");`,
    );

    this.addSql(
      `alter table "groups" add constraint "groups_owner_id_foreign" foreign key ("owner_id") references "users" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "memberships" add constraint "memberships_group_id_foreign" foreign key ("group_id") references "groups" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "memberships" add constraint "memberships_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "groups" drop constraint "groups_owner_id_foreign";`,
    );

    this.addSql(
      `alter table "memberships" drop constraint "memberships_user_id_foreign";`,
    );

    this.addSql(
      `alter table "memberships" drop constraint "memberships_group_id_foreign";`,
    );

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "groups" cascade;`);

    this.addSql(`drop table if exists "memberships" cascade;`);
  }
}
