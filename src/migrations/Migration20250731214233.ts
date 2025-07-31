import { Migration } from '@mikro-orm/migrations';

export class Migration20250731214233 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "groups" add column "capacity" int not null default 50, add column "invite_code" varchar(255) null;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "groups" drop column "capacity", drop column "invite_code";`,
    );
  }
}
