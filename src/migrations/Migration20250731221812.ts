import { Migration } from '@mikro-orm/migrations';

export class Migration20250731221812 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "memberships" drop constraint if exists "memberships_status_check";`,
    );

    this.addSql(
      `alter table "memberships" alter column "status" type text using ("status"::text);`,
    );
    this.addSql(
      `alter table "memberships" alter column "status" set default 'pending';`,
    );
    this.addSql(
      `alter table "memberships" add constraint "memberships_status_check" check("status" in ('pending', 'invited', 'accepted', 'declined', 'left'));`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "memberships" drop constraint if exists "memberships_status_check";`,
    );

    this.addSql(
      `alter table "memberships" alter column "status" type text using ("status"::text);`,
    );
    this.addSql(
      `alter table "memberships" alter column "status" set default 'invited';`,
    );
    this.addSql(
      `alter table "memberships" add constraint "memberships_status_check" check("status" in ('invited', 'accepted', 'declined', 'left'));`,
    );
  }
}
