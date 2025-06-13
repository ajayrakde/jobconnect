import { eq, ilike, and, desc, asc, or } from "drizzle-orm";
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { db } from "../../db";
import { 
  candidates, 
  employers, 
  jobPosts,
  users,
  candidateProfiles,
  employerProfiles
} from "../../../shared/schema";
import { createVerifyMiddleware } from "../../auth";
import { getCachedData, setCachedData, generateCacheKey } from "../../utils/cache";
import { trackSearchQuery } from "../../utils/analytics";

// Types for query parameters
interface SearchParams {
  type: 'candidate' | 'employer' | 'job';
  q?: string;
  sort?: 'latest' | 'name' | 'relevance';
  qualification?: string;
  experience?: string;
  status?: string;
  industry?: string;
  size?: string;
  category?: string;
}

// Compose middleware chain
const searchMiddleware = [
  searchLimiter,
  createVerifyMiddleware
];

interface ExtendedSearchParams extends SearchParams {
  pageSize?: number;
  cursor?: string;
  useCursor?: boolean;
}

export const searchHandler = [
  ...searchMiddleware,
  asyncHandler(async (req, res) => {
    const params = req.query as ExtendedSearchParams;
    const {
      type,
      q = '',
      sort = 'latest',
      page = 1,
      pageSize = 20,
      cursor,
      useCursor = false
    } = params;

    // Check cache first
    const cacheKey = generateCacheKey({ ...params, userId: req.user.id });
    const cachedResults = await getCachedData(cacheKey, { type: params.type });
    
    if (cachedResults) {
      // Track cached hit in analytics
      await trackSearchQuery({
        userId: req.user.id,
        searchType: type,
        query: q,
        filters: params,
        resultCount: cachedResults.length,
        timestamp: new Date(),
        cached: true
      });
      
      return res.json({ results: cachedResults });
    }

    let results;
    switch (type) {
      case 'candidate':
        results = await searchCandidates(params, q, sort);
        break;
      case 'employer':
        results = await searchEmployers(params, q, sort);
        break;
      case 'job':
        results = await searchJobs(params, q, sort);
        break;
      default:
        throw new Error('Invalid search type');
    }

    // Cache results with type-specific settings
    await setCachedData(cacheKey, results, { type: params.type });

    // Track search in analytics
    await trackSearchQuery({
      userId: req.user.id,
      searchType: type,
      query: q,
      filters: params,
      resultCount: results.length,
      timestamp: new Date(),
      cached: false
    });

    res.json({ results });
  })
];

async function searchCandidates(params: SearchParams, q: string, sort: string) {
  const { page = 1, pageSize = 20, cursor } = params;
  const validPageSize = validatePageSize(pageSize);

  // Use full-text search for better performance
  const searchQuery = q ? sql`
    to_tsvector('english', 
      coalesce(${users.firstName}::text, '') || ' ' ||
      coalesce(${users.lastName}::text, '') || ' ' ||
      coalesce(${users.email}::text, '') || ' ' ||
      coalesce(${candidateProfiles.title}::text, '')
    ) @@ plainto_tsquery('english', ${q})
  ` : undefined;

  const baseQuery = and(
    candidates.isVerified.equals(true),
    searchQuery || true
  );

  if (params.qualification) {
    baseQuery.push(eq(candidateProfiles.qualification, params.qualification));
  }

  if (params.experience) {
    baseQuery.push(eq(candidateProfiles.experienceYears, parseExperience(params.experience)));
  }

  // Cursor-based pagination for better performance
  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    if (decodedCursor) {
      baseQuery.push(
        sql`(${candidates.createdAt}, ${candidates.id}) < (${decodedCursor.timestamp}, ${decodedCursor.id})`
      );
    }
  }

  // Efficient sorting with indexes
  const orderBy = sort === 'latest' 
    ? [desc(candidates.createdAt), desc(candidates.id)]
    : sort === 'name'
    ? [asc(users.firstName), asc(users.lastName), desc(candidates.id)]
    : [desc(candidates.createdAt), desc(candidates.id)];

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: sql`count(*)::int` })
    .from(candidates)
    .where(baseQuery);

  // Get paginated results
  const results = await db.query.candidates.findMany({
    where: baseQuery,
    with: {
      user: true,
      profile: true
    },
    orderBy,
    limit: validPageSize + 1 // Get one extra to determine if there's a next page
  });

  const hasMore = results.length > validPageSize;
  const items = results.slice(0, validPageSize);
  
  // Generate next cursor from the last item
  const lastItem = items[items.length - 1];
  const nextCursor = lastItem 
    ? encodeCursor(lastItem.id, lastItem.createdAt)
    : undefined;

  const paginationInfo = {
    currentPage: page,
    pageSize: validPageSize,
    totalPages: Math.ceil(count / validPageSize),
    totalItems: count,
    hasNextPage: hasMore,
    hasPreviousPage: page > 1,
    nextCursor
  };

  // Transform results
  const data = items.map(candidate => ({
    id: candidate.id,
    type: 'candidate' as const,
    name: `${candidate.user.firstName} ${candidate.user.lastName}`,
    email: candidate.user.email,
    qualification: candidate.profile.qualification,
    experience: candidate.profile.experienceYears,
    city: candidate.profile.city,
    status: candidate.isVerified ? 'verified' : 'pending',
    avatar: candidate.user.avatarUrl
  }));

  return {
    data,
    pagination: paginationInfo
  };
}

async function searchEmployers(params: SearchParams, q: string, sort: string) {
  const query = and(
    employers.isVerified.equals(true),
    or(
      ilike(employerProfiles.companyName, `%${q}%`),
      ilike(employerProfiles.industry, `%${q}%`),
      ilike(users.email, `%${q}%`)
    )
  );

  if (params.industry) {
    query.push(eq(employerProfiles.industry, params.industry));
  }

  if (params.size) {
    query.push(eq(employerProfiles.companySize, params.size));
  }

  const orderBy = sort === 'latest'
    ? [desc(employers.createdAt)]
    : sort === 'name'
    ? [asc(employerProfiles.companyName)]
    : [];

  const results = await db.query.employers.findMany({
    where: query,
    with: {
      user: true,
      profile: true
    },
    orderBy
  });

  return results.map(employer => ({
    id: employer.id,
    type: 'employer',
    companyName: employer.profile.companyName,
    industry: employer.profile.industry,
    size: employer.profile.companySize,
    city: employer.profile.city,
    status: employer.isVerified ? 'verified' : 'pending',
    logo: employer.profile.logoUrl
  }));
}

async function searchJobs(params: SearchParams, q: string, sort: string) {
  const query = and(
    jobPosts.isActive.equals(true),
    or(
      ilike(jobPosts.title, `%${q}%`),
      ilike(jobPosts.description, `%${q}%`),
      ilike(employerProfiles.companyName, `%${q}%`)
    )
  );

  if (params.category) {
    query.push(eq(jobPosts.category, params.category));
  }

  const orderBy = sort === 'latest'
    ? [desc(jobPosts.createdAt)]
    : sort === 'name'
    ? [asc(jobPosts.title)]
    : [];

  const results = await db.query.jobPosts.findMany({
    where: query,
    with: {
      employer: {
        with: {
          profile: true
        }
      }
    },
    orderBy
  });

  return results.map(job => ({
    id: job.id,
    type: 'job',
    title: job.title,
    employer: job.employer.profile.companyName,
    employerId: job.employerId,
    city: job.location,
    status: job.isActive ? 'active' : 'inactive',
    postedOn: job.createdAt.toISOString(),
    category: job.category,
    experienceRequired: job.experienceRequired
  }));
}

// Helper function to parse experience string to number
function parseExperience(exp: string): number {
  if (exp === '0-2 years') return 0;
  if (exp === '3-5 years') return 3;
  if (exp === '5-10 years') return 5;
  if (exp === '10+ years') return 10;
  return 0;
}

export const adminSearchRouter = Router();

adminSearchRouter.get('/', ...searchHandler);
