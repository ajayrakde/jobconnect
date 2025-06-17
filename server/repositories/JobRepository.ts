import { db } from '../db';
import { jobPosts } from '@shared/schema';
import type { JobPost, InsertJobPost } from '@shared/types';

import { getJobStatus } from '@shared/utils/jobStatus';

import { eq, and } from 'drizzle-orm';

export class JobRepository {
  static async getJobPost(id: number): Promise<(JobPost & { status: string }) | undefined> {
    const [jobPost] = await db
      .select()
      .from(jobPosts)
      .where(eq(jobPosts.id, id));
    if (jobPost && jobPost.deleted) return undefined;
    return jobPost ? { ...jobPost, status: getJobStatus(jobPost) } : undefined;
  }

  static async getJobPostIncludingDeleted(id: number): Promise<(JobPost & { status: string }) | undefined> {
    const [jobPost] = await db
      .select()
      .from(jobPosts)
      .where(eq(jobPosts.id, id));
    return jobPost ? { ...jobPost, status: getJobStatus(jobPost) } : undefined;
  }

  static async createJobPost(insertJobPost: InsertJobPost): Promise<JobPost & { status: string }> {
    const [jobPost] = await db
      .insert(jobPosts)
      .values({
        ...insertJobPost,
        isActive: false,
        applicationsCount: 0,
      })
      .returning();
    return { ...jobPost, status: getJobStatus(jobPost) };
  }

  static async updateJobPost(id: number, updates: Partial<JobPost>): Promise<JobPost & { status: string }> {
    const [jobPost] = await db
      .update(jobPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobPosts.id, id))
      .returning();
    if (!jobPost) throw new Error('Job post not found');
    return { ...jobPost, status: getJobStatus(jobPost) };
  }

  static async getJobPostsByEmployer(employerId: number): Promise<(JobPost & { status: string })[]> {
      const jobs = await db
        .select()
        .from(jobPosts)
        .where(and(eq(jobPosts.employerId, employerId), eq(jobPosts.deleted, false)));
      return jobs.map((j: JobPost) => ({ ...j, status: getJobStatus(j) }));
  }

  static async getAllJobPosts(): Promise<(JobPost & { status: string })[]> {
      const jobs = await db
        .select()
        .from(jobPosts)
        .where(eq(jobPosts.deleted, false));
      return jobs.map((j: JobPost) => ({ ...j, status: getJobStatus(j) }));
  }

  static async getInactiveJobs(): Promise<(JobPost & { status: string })[]> {
      const jobs = await db
        .select()
        .from(jobPosts)
        .where(and(eq(jobPosts.isActive, false), eq(jobPosts.deleted, false)));
      return jobs.map((j: JobPost) => ({ ...j, status: getJobStatus(j) }));
  }

  static async getPublicJobs(): Promise<JobPost[]> {
    return await db
      .select()
      .from(jobPosts)
      .where(
        and(
          eq(jobPosts.isActive, true),
          eq(jobPosts.fulfilled, false),
          eq(jobPosts.deleted, false),
        ),
      );
  }

  static async markJobAsFulfilled(jobId: number): Promise<JobPost & { status: string }> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ fulfilled: true, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return { ...updatedJob, status: getJobStatus(updatedJob) };
  }

  static async approveJob(jobId: number): Promise<JobPost> {
    return this.activateJob(jobId);
  }

  static async holdJob(jobId: number): Promise<JobPost & { status: string }> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ isActive: false, onHold: true, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return { ...updatedJob, status: getJobStatus(updatedJob) };
  }

  static async activateJob(jobId: number): Promise<JobPost & { status: string }> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ isActive: true, onHold: false, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return { ...updatedJob, status: getJobStatus(updatedJob) };
  }

  static async deactivateJob(jobId: number): Promise<JobPost & { status: string }> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ isActive: false, onHold: false, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return { ...updatedJob, status: getJobStatus(updatedJob) };
  }

  static async softDeleteJobPost(jobId: number): Promise<JobPost & { status: string }> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ deleted: true, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return { ...updatedJob, status: getJobStatus(updatedJob) };
  }
}
