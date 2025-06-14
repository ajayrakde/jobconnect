import { eq, ilike, desc } from "drizzle-orm";
import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { db } from "../../db";
import { candidates, employers, jobPosts, users } from "../../../shared/schema";
import { authenticateUser } from "../../middleware/authenticate";

export const adminSearchRouter = Router();

adminSearchRouter.get(
  '/',
  authenticateUser,
  asyncHandler(async (req: any, res) => {
    const { type, q = '' } = req.query as { type: string; q?: string };

    if (type === 'candidate') {
      const results = await db
        .select()
        .from(candidates)
        .innerJoin(users, eq(users.id, candidates.userId))
        .where(ilike(users.name, `%${q}%`))
        .orderBy(desc(candidates.createdAt))
        .limit(20);
      return res.json({ results });
    }

    if (type === 'employer') {
      const results = await db
        .select()
        .from(employers)
        .where(ilike(employers.organizationName, `%${q}%`))
        .orderBy(desc(employers.createdAt))
        .limit(20);
      return res.json({ results });
    }

    if (type === 'job') {
      const results = await db
        .select()
        .from(jobPosts)
        .where(ilike(jobPosts.title, `%${q}%`))
        .orderBy(desc(jobPosts.createdAt))
        .limit(20);
      return res.json({ results });
    }

    res.status(400).json({ message: 'Invalid search type' });
  })
);
