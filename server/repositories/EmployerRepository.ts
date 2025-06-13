import { db } from '../db';
import { Employer, InsertEmployer, JobPost, employers, jobPosts } from '@shared/schema';
import { eq, ne, desc, and } from 'drizzle-orm';

export class EmployerRepository {
  static async getEmployer(id: number): Promise<Employer | undefined> {
    const [employer] = await db
      .select()
      .from(employers)
      .where(and(eq(employers.id, id), eq(employers.deleted, false)));
    return employer || undefined;
  }

  static async getEmployerByUserId(userId: number): Promise<Employer | undefined> {
    const [employer] = await db
      .select()
      .from(employers)
      .where(and(eq(employers.userId, userId), eq(employers.deleted, false)));
    return employer || undefined;
  }

  static async createEmployer(insertEmployer: InsertEmployer): Promise<Employer> {
    const [employer] = await db
      .insert(employers)
      .values({
        ...insertEmployer,
        profileStatus: 'pending',
      })
      .returning();
    return employer;
  }

  static async updateEmployer(id: number, updates: Partial<Employer>): Promise<Employer> {
    const [employer] = await db
      .update(employers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    if (!employer) throw new Error('Employer not found');
    return employer;
  }

  static async getUnverifiedEmployers(): Promise<Employer[]> {
    return await db
      .select()
      .from(employers)
      .where(and(eq(employers.deleted, false), ne(employers.profileStatus, 'verified')));
  }

  static async verifyEmployer(id: number): Promise<Employer> {
    const [employer] = await db
      .update(employers)
      .set({ profileStatus: 'verified', updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    if (!employer) throw new Error('Employer not found');
    return employer;
  }

  static async softDeleteEmployer(id: number): Promise<Employer> {
    const [employer] = await db
      .update(employers)
      .set({ deleted: true, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    if (!employer) throw new Error('Employer not found');
    return employer;
  }

  static async getEmployerStats(employerId: number): Promise<any> {
    const employerJobs: JobPost[] = await db.select().from(jobPosts).where(eq(jobPosts.employerId, employerId));
    const activeJobs = employerJobs.filter((job: JobPost) => job.isActive && !job.fulfilled).length;
    const fulfilledJobs = employerJobs.filter((job: JobPost) => job.fulfilled).length;
    const totalApplications = employerJobs.reduce((sum: number, job: JobPost) => sum + (job.applicationsCount || 0), 0);

    return {
      activeJobs,
      fulfilledJobs,
      totalApplications,
      profileViews: Math.floor(Math.random() * 200) + 50,
      successfulHires: Math.floor(Math.random() * 10) + 2,
    };
  }

  static async getFulfilledJobsByEmployer(employerId: number): Promise<JobPost[]> {
    return await db
      .select()
      .from(jobPosts)
      .where(and(eq(jobPosts.employerId, employerId), eq(jobPosts.fulfilled, true)))
      .orderBy(desc(jobPosts.updatedAt));
  }

  static async getActiveUnfulfilledJobsByEmployer(employerId: number): Promise<JobPost[]> {
    return await db
      .select()
      .from(jobPosts)
      .where(and(eq(jobPosts.employerId, employerId), eq(jobPosts.isActive, true), eq(jobPosts.fulfilled, false)))
      .orderBy(desc(jobPosts.createdAt));
  }
}
