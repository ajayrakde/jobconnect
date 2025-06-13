import { Router } from 'express';
import { storage } from '../storage';
import { insertCandidateSchema, type InsertCandidate } from '@shared/schema';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';

export const candidatesRouter = Router();

candidatesRouter.get(
  '/profile',
  ...requireVerifiedRole('candidate'),
  async (req: any, res) => {
    try {
      const candidate = req.candidate;
      res.json(candidate);
    } catch (error) {
      console.error('Candidate profile fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch candidate profile' });
    }
  }
);

candidatesRouter.patch(
  '/:id',
  authenticateUser,
  requireRole('candidate'),
  async (req: any, res) => {
    try {
      const user = req.dbUser;
      const candidate = await storage.getCandidateByUserId(user.id);
      if (!candidate || candidate.id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      const updatedCandidate = await storage.updateCandidate(candidate.id, req.body);
      res.json(updatedCandidate);
    } catch (error) {
      console.error('Candidate update error:', error);
      res.status(400).json({ message: 'Failed to update candidate profile' });
    }
  }
);

candidatesRouter.post(
  '/',
  authenticateUser,
  requireRole('candidate'),
  async (req: any, res) => {
    try {
      const user = req.dbUser;
      const candidateData: InsertCandidate = insertCandidateSchema.parse({
        ...req.body,
        userId: user.id,
      });
      const candidate = await storage.createCandidate(candidateData);
      res.json(candidate);
    } catch (error) {
      console.error('Candidate creation error:', error);
      res.status(400).json({ message: 'Failed to create candidate profile' });
    }
  }
);

candidatesRouter.get(
  '/stats',
  ...requireVerifiedRole('candidate'),
  async (req: any, res) => {
    try {
      const candidate = req.candidate;
      const stats = await storage.getCandidateStats(candidate.id);
      res.json(stats);
    } catch (error) {
      console.error('Stats fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  }
);

candidatesRouter.get(
  '/recommended-jobs',
  ...requireVerifiedRole('candidate'),
  async (req: any, res) => {
    try {
      const candidate = req.candidate;
      const jobs = await storage.getRecommendedJobs(candidate.id);
      res.json(jobs);
    } catch (error) {
      console.error('Recommended jobs fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch recommended jobs' });
    }
  }
);

candidatesRouter.get(
  '/applications',
  ...requireVerifiedRole('candidate'),
  async (req: any, res) => {
    try {
      const candidate = req.candidate;
      const applications = await storage.getCandidateApplications(candidate.id);
      res.json(applications);
    } catch (error) {
      console.error('Applications fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  }
);
