import { Router } from 'express';
import { storage } from '../storage';
import { insertCandidateSchema, type InsertCandidate } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';

export const candidatesRouter = Router();

candidatesRouter.get('/profile', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'candidate') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidate = await storage.getCandidateByUserId(user.id);
  if (!candidate || candidate.deleted) {
    return res.status(404).json({ message: 'Candidate profile not found' });
  }
  if (candidate.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Candidate not verified' });
  }
  res.json(candidate);
}));

candidatesRouter.patch('/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'candidate') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidate = await storage.getCandidateByUserId(user.id);
  if (!candidate || candidate.id !== parseInt(req.params.id)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const updatedCandidate = await storage.updateCandidate(candidate.id, req.body);
  res.json(updatedCandidate);
}));

candidatesRouter.post('/', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'candidate') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidateData: InsertCandidate = insertCandidateSchema.parse({
    ...req.body,
    userId: user.id,
  });
  const candidate = await storage.createCandidate(candidateData);
  res.json(candidate);
}));

candidatesRouter.get('/stats', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'candidate') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidate = await storage.getCandidateByUserId(user.id);
  if (!candidate || candidate.deleted) {
    return res.status(404).json({ message: 'Candidate profile not found' });
  }
  if (candidate.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Candidate not verified' });
  }
  const stats = await storage.getCandidateStats(candidate.id);
  res.json(stats);
}));

candidatesRouter.get('/recommended-jobs', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'candidate') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidate = await storage.getCandidateByUserId(user.id);
  if (!candidate || candidate.deleted) {
    return res.status(404).json({ message: 'Candidate profile not found' });
  }
  if (candidate.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Candidate not verified' });
  }
  const jobs = await storage.getRecommendedJobs(candidate.id);
  res.json(jobs);
}));

candidatesRouter.get('/applications', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'candidate') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidate = await storage.getCandidateByUserId(user.id);
  if (!candidate || candidate.deleted) {
    return res.status(404).json({ message: 'Candidate profile not found' });
  }
  if (candidate.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Candidate not verified' });
  }
  const applications = await storage.getCandidateApplications(candidate.id);
  res.json(applications);
}));
