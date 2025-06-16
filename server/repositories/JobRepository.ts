import { db } from '../db';
import { jobPosts } from '@shared/schema';
import type { JobPost, InsertJobPost } from '@shared/types';
import { eq } from 'drizzle-orm';

export class JobRepository {
  static async getJobPost(id: number): Promise<JobPost | undefined> {
    const [jobPost] = await db
      .select()
      .from(jobPosts)
      .where(eq(jobPosts.id, id));
    if (jobPost && jobPost.deleted) return undefined;
    return jobPost || undefined;
  }

  static async createJobPost(insertJobPost: InsertJobPost): Promise<JobPost> {
    const [jobPost] = await db
      .insert(jobPosts)
      .values({
        ...insertJobPost,
        isActive: true,
        applicationsCount: 0,
      })
      .returning();
    return jobPost;
  }

  static async updateJobPost(id: number, updates: Partial<JobPost>): Promise<JobPost> {
    const [jobPost] = await db
      .update(jobPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobPosts.id, id))
      .returning();
    if (!jobPost) throw new Error('Job post not found');
    return jobPost;
  }

  static async getJobPostsByEmployer(employerId: number): Promise<JobPost[]> {
    return await db
      .select()
      .from(jobPosts)
      .where(eq(jobPosts.employerId, employerId));
  }

  static async getAllJobPosts(): Promise<JobPost[]> {
    return await db.select().from(jobPosts);
  }

  static async getInactiveJobs(): Promise<JobPost[]> {
    return await db
      .select()
      .from(jobPosts)
      .where(eq(jobPosts.isActive, false));
  }

  static async markJobAsFulfilled(jobId: number): Promise<JobPost> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ fulfilled: true, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return updatedJob;
  }

  static async approveJob(jobId: number): Promise<JobPost> {
    return this.activateJob(jobId);
  }

  static async holdJob(jobId: number): Promise<JobPost> {
    return this.deactivateJob(jobId);
  }

  static async activateJob(jobId: number): Promise<JobPost> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return updatedJob;
  }

  static async deactivateJob(jobId: number): Promise<JobPost> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return updatedJob;
  }

  static async softDeleteJobPost(jobId: number): Promise<JobPost> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ deleted: true, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return updatedJob;
  }
}
