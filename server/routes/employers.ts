import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertEmployerSchema, insertJobPostSchema, type InsertEmployer, type InsertJobPost } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';

export const employersRouter = Router();

employersRouter.post('/', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const existingEmployer = await storage.getEmployerByUserId(user.id);
  if (existingEmployer) {
    return res.status(409).json({ message: 'Employer profile already exists', code: 'EMPLOYER_EXISTS' });
  }
  const employerData: InsertEmployer = insertEmployerSchema.parse({ ...req.body, userId: user.id });
  const employer = await storage.createEmployer(employerData);
  res.json(employer);
}));

employersRouter.get('/stats', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer || employer.deleted) {
    return res.status(404).json({ message: 'Employer profile not found' });
  }
  if (employer.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Employer not verified' });
  }
  const stats = await storage.getEmployerStats(employer.id);
  res.json(stats);
}));

employersRouter.get('/jobs', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer || employer.deleted) {
    return res.status(404).json({ message: 'Employer profile not found' });
  }
  if (employer.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Employer not verified' });
  }
  const jobPosts = await storage.getJobPostsByEmployer(employer.id);
  res.json(jobPosts);
}));

employersRouter.get('/recent-jobs', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer) {
    return res.status(404).json({ message: 'Employer profile not found' });
  }
  if (employer.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Employer not verified' });
  }
  const recentJobs = await storage.getActiveUnfulfilledJobsByEmployer(employer.id);
  res.json(recentJobs.slice(0, 5));
}));

employersRouter.get('/fulfilled-jobs', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer) {
    return res.status(404).json({ message: 'Employer profile not found' });
  }
  if (employer.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Employer not verified' });
  }
  const fulfilledJobs = await storage.getFulfilledJobsByEmployer(employer.id);
  res.json(fulfilledJobs);
}));

// Job post creation via employers
employersRouter.post('/jobs', authenticateUser, asyncHandler(async (req: Request, res: Response) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Only verified employers can create job posts',
    });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer || employer.profileStatus !== 'verified') {
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Your employer profile must be verified to create job posts',
    });
  }
  const jobData = { ...req.body, employerId: employer.id, status: 'active', createdAt: new Date(), updatedAt: new Date() };
  const jobPost = await storage.createJobPost(jobData);
  res.status(201).json({ success: true, data: jobPost });
}));

employersRouter.get('/profile', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer) {
    return res.status(404).json({ message: 'Employer profile not found' });
  }
  res.json(employer);
}));

employersRouter.patch('/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employerId = parseInt(req.params.id);
  const employer = await storage.getEmployer(employerId);
  if (!employer || employer.userId !== user.id) {
    return res.status(404).json({ message: 'Employer not found or access denied' });
  }
  const updatedEmployer = await storage.updateEmployer(employerId, req.body);
  res.json(updatedEmployer);
}));

// Generic job-post endpoint
employersRouter.post('/job-posts', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer) {
    return res.status(404).json({ message: 'Employer profile not found' });
  }
  const jobData: InsertJobPost = insertJobPostSchema.parse({ ...req.body, employerId: employer.id });
  const jobPost = await storage.createJobPost(jobData);
  res.json(jobPost);
}));
