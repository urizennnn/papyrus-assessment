import { Migration } from '@mikro-orm/migrations';

export class Migration20250731211922 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "refresh_tokens" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "deleted_at" timestamptz null, "deleted" boolean not null default false, "user_id" uuid not null, "token_hash" varchar(255) not null, "fingerprint" varchar(255) not null, "ip" varchar(255) not null, "user_agent" varchar(255) not null, "revoked" boolean not null default false, "expires_at" timestamptz not null, constraint "refresh_tokens_pkey" primary key ("id"));`,
    );

    this.addSql(
      `alter table "refresh_tokens" add constraint "refresh_tokens_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "refresh_tokens" cascade;`);
  }
}
