import { z } from 'zod';

// Schema for job post validation
export const jobPostSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters'),
  minQualification: z.string()
    .min(1, 'Minimum qualification is required'),
  experienceRequired: z.string()
    .min(1, 'Experience requirement is required'),
  skills: z.string()
    .min(1, 'Skills are required'),
  responsibilities: z.string()
    .min(1, 'Responsibilities are required'),
  vacancy: z.number()
    .int()
    .positive('Number of vacancies must be positive'),
  location: z.string()
    .min(1, 'Location is required'),
  salaryRange: z.string()
    .min(1, 'Salary range is required'),
  jobCode: z.string().optional(),
  employerId: z.number()
    .int()
    .positive('Invalid employer ID'),
  status: z.enum(['draft', 'active', 'inactive', 'fulfilled'])
    .default('draft'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// Base type for job post
export type JobPost = z.infer<typeof jobPostSchema>;

// Type for creating a new job post (omits system-managed fields)
export type CreateJobPostInput = Omit<
  JobPost,
  'id' | 'jobCode' | 'status' | 'createdAt' | 'updatedAt'
>;

// Type for updating an existing job post (all fields optional)
export type UpdateJobPostInput = Partial<CreateJobPostInput>;

// Schema for job post search parameters
export const jobPostSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.string().optional(),
  employerId: z.number().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'fulfilled']).optional(),
  sortBy: z.enum(['latest', 'salary', 'relevance']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
});

// Type for search parameters
export type JobPostSearchParams = z.infer<typeof jobPostSearchSchema>;

// Response types
export interface JobPostResponse {
  id: number;
  jobCode: string;
  employer: {
    id: number;
    name: string;
    logo?: string;
  };
  title: string;
  location: string;
  status: string;
  createdAt: Date;
}

export interface JobPostDetailResponse extends JobPostResponse {
  description: string;
  minQualification: string;
  experienceRequired: string;
  skills: string;
  responsibilities: string;
  vacancy: number;
  salaryRange: string;
  updatedAt: Date;
}
