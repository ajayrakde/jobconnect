import { pgTable, serial, integer, timestamp, text } from 'drizzle-orm/pg-core';
import { candidates } from './candidates';
import { jobPosts } from './jobs';
import { relations } from 'drizzle-orm';

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').notNull().references(() => candidates.id),
  jobPostId: integer('job_post_id').notNull().references(() => jobPosts.id),
  status: text('status').default('applied'),
  appliedAt: timestamp('applied_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const applicationRelations = relations(applications, ({ one }) => ({
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  jobPost: one(jobPosts, {
    fields: [applications.jobPostId],
    references: [jobPosts.id],
  }),
}));
