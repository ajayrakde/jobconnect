import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { employers, users } from '@/shared/schema';
import type { InsertEmployer } from '@/shared/schema';

/**
 * Repository for handling employer-related database operations
 */
export class EmployerRepository {
  /**
   * Find an employer by their user ID
   */
  static async findByUserId(userId: number) {
    const [employer] = await db
      .select()
      .from(employers)
      .where(
        and(
          eq(employers.userId, userId),
          eq(employers.deleted, false)
        )
      )
      .limit(1);
    
    return employer;
  }

  /**
   * Create a new employer profile
   */
  static async create(data: InsertEmployer) {
    const [employer] = await db
      .insert(employers)
      .values(data)
      .returning();
    
    return employer;
  }

  /**
   * Update an employer's profile
   */
  static async update(id: number, data: Partial<InsertEmployer>) {
    const [updated] = await db
      .update(employers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Find all unverified employers with user details
   */
  static async findUnverified() {
    const result = await db
      .select({
        employer: employers,
        user: {
          name: users.name,
          email: users.email
        }
      })
      .from(employers)
      .innerJoin(users, eq(users.id, employers.userId))
      .where(
        and(
          eq(employers.profileStatus, 'pending'),
          eq(employers.deleted, false)
        )
      );
    
    return result;
  }

  /**
   * Verify an employer's profile
   */
  static async verify(id: number) {
    const [updated] = await db
      .update(employers)
      .set({ 
        profileStatus: 'verified',
        updatedAt: new Date()
      })
      .where(eq(employers.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Reject an employer's profile
   */
  static async reject(id: number) {
    const [updated] = await db
      .update(employers)
      .set({ 
        profileStatus: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(employers.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Get employer statistics
   */
  static async getStats(employerId: number) {
    // Add your statistics query here
    const stats = await db.transaction(async (tx) => {
      const [activeJobsCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(jobPosts)
        .where(
          and(
            eq(jobPosts.employerId, employerId),
            eq(jobPosts.isActive, true),
            eq(jobPosts.deleted, false)
          )
        );

      const [totalApplications] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(jobPosts)
        .leftJoin(applications, eq(applications.jobPostId, jobPosts.id))
        .where(eq(jobPosts.employerId, employerId));

      return {
        activeJobs: activeJobsCount.count,
        totalApplications: totalApplications.count
      };
    });

    return stats;
  }

  /**
   * Soft delete an employer's profile
   */
  static async delete(id: number) {
    const [deleted] = await db
      .update(employers)
      .set({ 
        deleted: true,
        updatedAt: new Date()
      })
      .where(eq(employers.id, id))
      .returning();
    
    return deleted;
  }
}
