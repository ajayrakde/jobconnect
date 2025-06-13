import { pgTable, serial, integer, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  maritalStatus: text('marital_status'),
  dependents: integer('dependents').default(0),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  qualifications: jsonb('qualifications'),
  experience: jsonb('experience'),
  skills: jsonb('skills'),
  languages: jsonb('languages'),
  expectedSalary: integer('expected_salary'),
  jobCodes: jsonb('job_codes'),
  documents: jsonb('documents'),
  profileStatus: text('profile_status').notNull().default('pending'),
  deleted: boolean('deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const candidateRelations = relations(candidates, ({ one, many }) => ({
  user: one(users, {
    fields: [candidates.userId],
    references: [users.id],
  }),
  applications: many(applications)
}));
