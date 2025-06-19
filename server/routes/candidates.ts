import { Router } from 'express';
import { insertCandidateSchema } from '@shared/zod';
import type { InsertCandidate } from '@shared/types';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validation';
import { CandidateRepository } from '../repositories';
import { storage } from '../storage';

export const candidatesRouter = Router();

candidatesRouter.get(
  '/profile',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const candidate = req.candidate;
    res.json(candidate);
  })
);

candidatesRouter.patch(
  '/:id',
  authenticateUser,
  requireRole('candidate'),
  validateBody(insertCandidateSchema.partial()),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const candidate = await CandidateRepository.findByUserId(user.id);
    if (!candidate || candidate.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updatedCandidate = await CandidateRepository.update(candidate.id, req.body);
    res.json(updatedCandidate);
  })
);

candidatesRouter.post(
  '/',
  authenticateUser,
  requireRole('candidate'),
  validateBody(insertCandidateSchema),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const candidateData: InsertCandidate = {
      ...req.body,
      userId: user.id,
    } as InsertCandidate;
    const candidate = await storage.createCandidate(candidateData);
    res.json(candidate);
  })
);

candidatesRouter.get(
  '/stats',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const candidate = req.candidate;
    const stats = await storage.getCandidateStats(candidate.id);
    res.json(stats);
  })
);

candidatesRouter.get(
  '/recommended-jobs',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const candidate = req.candidate;
    const jobs = await storage.getRecommendedJobs(candidate.id);
    res.json(jobs);
  })
);

candidatesRouter.get(
  '/applications',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const candidate = req.candidate;
    const applications = await storage.getCandidateApplications(candidate.id);
    res.json(applications);
  })
);

// Public job listings
candidatesRouter.get(
  '/jobs',
  asyncHandler(async (_req, res) => {
    const jobs = await storage.getPublicJobPosts();
    res.json(jobs);
  })
);

// Candidate view of a job detail (without employer info or vacancy)
candidatesRouter.get(
  '/jobs/:id',
  ...requireVerifiedRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || job.deleted || job.jobStatus !== 'ACTIVE') {
      return res.status(404).json({ message: 'Job not found' });
    }
    const { employerId, vacancy, ...rest } = job as any;
    res.json(rest);
  })
);
