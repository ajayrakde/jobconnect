import { pgTable, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { candidates, employers, jobPosts, users, candidateProfiles, employerProfiles } from './schema';

// Add composite indexes for efficient search and pagination
export const searchIndexes = {
  candidates: [
    // Efficient pagination and filtering
    index('idx_candidates_search').on(table => [
      table.isVerified,
      table.createdAt.desc(),
      table.id.desc()
    ]),

    // Full-text search for candidates
    index('idx_candidates_full_text').on(sql`to_tsvector('english',
      coalesce(${users.firstName}::text, '') || ' ' ||
      coalesce(${users.lastName}::text, '') || ' ' ||
      coalesce(${users.email}::text, '') || ' ' ||
      coalesce(${candidateProfiles.title}::text, '')
    )`).using('gin')
  ],

  employers: [
    // Efficient pagination and filtering
    index('idx_employers_search').on(table => [
      table.isVerified,
      table.createdAt.desc(),
      table.id.desc()
    ]),

    // Full-text search for employers
    index('idx_employers_full_text').on(sql`to_tsvector('english',
      coalesce(${employerProfiles.companyName}::text, '') || ' ' ||
      coalesce(${employerProfiles.industry}::text, '') || ' ' ||
      coalesce(${employerProfiles.city}::text, '')
    )`).using('gin')
  ],

  jobPosts: [
    // Efficient pagination and filtering
    index('idx_jobs_search').on(table => [
      table.isActive,
      table.createdAt.desc(),
      table.id.desc()
    ]),

    // Full-text search for jobs
    index('idx_jobs_full_text').on(sql`to_tsvector('english',
      coalesce(${jobPosts.title}::text, '') || ' ' ||
      coalesce(${jobPosts.description}::text, '') || ' ' ||
      coalesce(${jobPosts.location}::text, '')
    )`).using('gin')
  ],

  // Foreign key indexes for efficient joins
  foreignKeys: [
    index('idx_candidates_user_id').on(candidates.userId),
    index('idx_employers_user_id').on(employers.userId),
    index('idx_jobs_employer_id').on(jobPosts.employerId)
  ]
};
