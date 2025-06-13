import { z } from 'zod';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { generateJobCode } from '../utils/jobCodeGenerator';

// ========== Schema Definitions ==========
export const jobPostSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  minQualification: z.string(),
  experienceRequired: z.string(),
  skills: z.string(),
  responsibilities: z.string(),
  vacancy: z.number().int().positive(),
  location: z.string(),
  salaryRange: z.string(),
  jobCode: z.string().optional(),
  employerId: z.number().int().positive(),
  status: z.enum(['active', 'inactive', 'fulfilled']).default('active'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

// ========== Type Definitions ==========
export type JobPost = z.infer<typeof jobPostSchema>;

export const createJobPostSchema = jobPostSchema.omit({
  jobCode: true,
  status: true,
  createdAt: true,
  updatedAt: true
});

export type CreateJobPost = z.infer<typeof createJobPostSchema>;

// ========== Database Operations ==========
export const jobPostOperations = {
  create: async (data: CreateJobPost) => {
    const validatedData = createJobPostSchema.parse(data);
    const jobCode = await generateJobCode();

    const [jobPost] = await db.insert(jobPosts)
      .values({
        ...validatedData,
        jobCode,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return jobPost;
  },

  get: async (id: number) => {
    const [jobPost] = await db
      .select()
      .from(jobPosts)
      .where(eq(jobPosts.id, id))
      .limit(1);

    return jobPost;
  },

  update: async (id: number, data: Partial<CreateJobPost>) => {
    const [updated] = await db
      .update(jobPosts)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(jobPosts.id, id))
      .returning();

    return updated;
  },

  delete: async (id: number) => {
    const [deleted] = await db
      .delete(jobPosts)
      .where(eq(jobPosts.id, id))
      .returning();

    return deleted;
  },

  // Additional operations
  listActive: async () => {
    return db
      .select()
      .from(jobPosts)
      .where(eq(jobPosts.status, 'active'))
      .orderBy(desc(jobPosts.createdAt));
  },

  search: async (query: string) => {
    return db
      .select()
      .from(jobPosts)
      .where(
        sql`to_tsvector('english', 
          coalesce(title, '') || ' ' || 
          coalesce(description, '') || ' ' || 
          coalesce(skills, '')
        ) @@ plainto_tsquery('english', ${query})`
      )
      .orderBy(desc(jobPosts.createdAt));
  }
};

// Export a single unified interface
export const JobPosts = {
  schema: jobPostSchema,
  createSchema: createJobPostSchema,
  ...jobPostOperations
};
