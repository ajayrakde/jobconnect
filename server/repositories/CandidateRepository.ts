import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { candidates, users } from '@/shared/schema';
import type { InsertCandidate } from '@/shared/schema';

/**
 * Repository for handling candidate-related database operations
 */
export class CandidateRepository {
  /**
   * Find a candidate by their user ID with profile details
   */
  static async findByUserId(userId: number) {
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.userId, userId),
          eq(candidates.deleted, false)
        )
      )
      .limit(1);
    
    return candidate;
  }

  /**
   * Create a new candidate profile
   */
  static async create(data: InsertCandidate) {
    const [candidate] = await db
      .insert(candidates)
      .values(data)
      .returning();
    
    return candidate;
  }

  /**
   * Update a candidate's profile
   */
  static async update(id: number, data: Partial<InsertCandidate>) {
    const [updated] = await db
      .update(candidates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Get all unverified candidates
   */
  static async findUnverified() {
    const result = await db
      .select({
        candidate: candidates,
        user: {
          name: users.name,
          email: users.email
        }
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(
        and(
          eq(candidates.profileStatus, 'pending'),
          eq(candidates.deleted, false)
        )
      );
    
    return result;
  }

  /**
   * Verify a candidate's profile
   */
  static async verify(id: number) {
    const [updated] = await db
      .update(candidates)
      .set({ 
        profileStatus: 'verified',
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Reject a candidate's profile
   */
  static async reject(id: number) {
    const [updated] = await db
      .update(candidates)
      .set({ 
        profileStatus: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id))
      .returning();
    
    return updated;
  }

  /**
   * Soft delete a candidate's profile
   */
  static async delete(id: number) {
    const [deleted] = await db
      .update(candidates)
      .set({ 
        deleted: true,
        updatedAt: new Date()
      })
      .where(eq(candidates.id, id))
      .returning();
    
    return deleted;
  }
}
