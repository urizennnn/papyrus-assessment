import { Migration } from '@mikro-orm/migrations';

export class Migration20250731233244 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "groups" add column "member_count" int not null default 0;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "groups" drop column "member_count";`);
  }
}
