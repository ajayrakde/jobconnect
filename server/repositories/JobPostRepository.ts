import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { jobPosts } from '@shared/schema';
import { 
  jobPostSchema,
  type CreateJobPostInput,
  type UpdateJobPostInput,
  type JobPostSearchParams,
  type JobPostResponse,
  type JobPostDetailResponse
} from '@shared/schemas/JobPostSchema';
import { generateJobCode } from '../utils/jobCodeGenerator';

/**
 * Repository for handling job post database operations
 */
export class JobPostRepository {
  /**
   * Create a new job post
   */
  static async create(input: CreateJobPostInput): Promise<JobPostResponse> {
    const validated = jobPostSchema.parse({
      ...input,
      jobCode: await generateJobCode(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const [jobPost] = await db.insert(jobPosts)
      .values(validated)
      .returning();

    return this.mapToResponse(jobPost);
  }

  /**
   * Find a job post by ID with employer details
   */
  static async findById(id: number): Promise<JobPostDetailResponse | null> {
    const jobPost = await db.query.jobPosts.findFirst({
      where: eq(jobPosts.id, id),
      with: {
        employer: {
          columns: {
            id: true,
            organizationName: true,
            logo: true
          }
        }
      }
    });

    return jobPost ? this.mapToDetailResponse(jobPost) : null;
  }

  /**
   * Find active job posts for an employer
   */
  static async findByEmployer(employerId: number) {
    return db.query.jobPosts.findMany({
      where: and(
        eq(jobPosts.employerId, employerId),
        eq(jobPosts.status, 'active')
      ),
      orderBy: desc(jobPosts.createdAt)
    });
  }

  /**
   * Update an existing job post
   */
  static async update(id: number, input: UpdateJobPostInput): Promise<JobPostResponse> {
    const validated = jobPostSchema.partial().parse({
      ...input,
      updatedAt: new Date()
    });

    const [updated] = await db.update(jobPosts)
      .set(validated)
      .where(eq(jobPosts.id, id))
      .returning();

    return this.mapToResponse(updated);
  }

  /**
   * Delete a job post
   */
  static async delete(id: number): Promise<boolean> {
    const [deleted] = await db.delete(jobPosts)
      .where(eq(jobPosts.id, id))
      .returning();

    return !!deleted;
  }

  /**
   * Search job posts with filters and pagination
   */
  static async search(params: JobPostSearchParams) {
    const {
      query,
      location,
      experienceLevel,
      employerId,
      status,
      sortBy = 'latest',
      page = 1,
      limit = 20
    } = params;

    let whereClause = sql`true`;

    if (query) {
      whereClause = sql`${whereClause} AND (
        to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', ${query})
      )`;
    }

    if (location) {
      whereClause = sql`${whereClause} AND location ILIKE ${`%${location}%`}`;
    }

    if (experienceLevel) {
      whereClause = sql`${whereClause} AND experience_required = ${experienceLevel}`;
    }

    if (employerId) {
      whereClause = sql`${whereClause} AND employer_id = ${employerId}`;
    }

    if (status) {
      whereClause = sql`${whereClause} AND status = ${status}`;
    }

    const offset = (page - 1) * limit;

    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobPosts)
      .where(whereClause);

    const results = await db.query.jobPosts.findMany({
      where: whereClause,
      with: {
        employer: {
          columns: {
            id: true,
            organizationName: true,
            logo: true
          }
        }
      },
      limit,
      offset,
      orderBy: [
        sortBy === 'latest' ? desc(jobPosts.createdAt) :
        sortBy === 'salary' ? desc(jobPosts.salaryRange) :
        desc(sql`ts_rank_cd(to_tsvector('english', title || ' ' || description), plainto_tsquery('english', ${query}))`)
      ]
    });

    return {
      results: results.map(this.mapToResponse),
      pagination: {
        total: totalCount.count,
        page,
        limit,
        totalPages: Math.ceil(totalCount.count / limit)
      }
    };
  }

  /**
   * Map database record to response type
   */
  private static mapToResponse(jobPost: any): JobPostResponse {
    return {
      id: jobPost.id,
      jobCode: jobPost.jobCode,
      employer: {
        id: jobPost.employer.id,
        name: jobPost.employer.organizationName,
        logo: jobPost.employer.logo
      },
      title: jobPost.title,
      location: jobPost.location,
      status: jobPost.status,
      createdAt: jobPost.createdAt
    };
  }

  /**
   * Map database record to detailed response type
   */
  private static mapToDetailResponse(jobPost: any): JobPostDetailResponse {
    return {
      ...this.mapToResponse(jobPost),
      description: jobPost.description,
      minQualification: jobPost.minQualification,
      experienceRequired: jobPost.experienceRequired,
      skills: jobPost.skills,
      responsibilities: jobPost.responsibilities,
      vacancy: jobPost.vacancy,
      salaryRange: jobPost.salaryRange,
      updatedAt: jobPost.updatedAt
    };
  }
}
