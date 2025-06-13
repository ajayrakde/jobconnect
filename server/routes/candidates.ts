import { Router } from 'express';
import { storage } from '../storage';
import { insertCandidateSchema, type InsertCandidate } from '@shared/schema';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { asyncHandler } from '../utils/asyncHandler';

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
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const candidate = await storage.getCandidateByUserId(user.id);
    if (!candidate || candidate.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updatedCandidate = await storage.updateCandidate(candidate.id, req.body);
    res.json(updatedCandidate);
  })
);

candidatesRouter.post(
  '/',
  authenticateUser,
  requireRole('candidate'),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const candidateData: InsertCandidate = insertCandidateSchema.parse({
      ...req.body,
      userId: user.id,
    });
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
