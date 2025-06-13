import { pgTable, serial, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const adminInviteCodes = pgTable('admin_invite_codes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  used: boolean('used').notNull().default(false),
  usedBy: integer('used_by'),
  createdAt: timestamp('created_at').defaultNow(),
  usedAt: timestamp('used_at')
});
