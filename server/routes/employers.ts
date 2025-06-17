import { Router } from 'express';
import { insertEmployerSchema, insertJobPostSchema } from '@shared/zod';
import type { InsertEmployer, InsertJobPost } from '@shared/types';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validation';
import { EmployerRepository, JobPostRepository } from '../repositories';
import { storage } from '../storage';

export const employersRouter = Router();

employersRouter.post(
  '/',
  authenticateUser,
  requireRole('employer'),
  validateBody(insertEmployerSchema),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const existingEmployer = await EmployerRepository.findByUserId(user.id);
    
    if (existingEmployer) {
      return res.status(409).json({ 
        message: 'Employer profile already exists',
        code: 'EMPLOYER_EXISTS' 
      });
    }

    const employerData: InsertEmployer = { 
      ...req.body,
      userId: user.id 
    };
    
    const employer = await EmployerRepository.create(employerData);
    res.status(201).json(employer);
  })
);

employersRouter.get(
  '/stats',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const stats = await storage.getEmployerStats(employer.id);
    res.json(stats);
  })
);

employersRouter.get(
  '/jobs',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobPosts = await storage.getJobPostsByEmployer(employer.id);
    res.json(jobPosts);
  })
);

employersRouter.get(
  '/recent-jobs',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const recentJobs = await storage.getActiveUnfulfilledJobsByEmployer(employer.id);
    res.json(recentJobs.slice(0, 5));
  })
);

employersRouter.get(
  '/fulfilled-jobs',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const fulfilledJobs = await storage.getFulfilledJobsByEmployer(employer.id);
    res.json(fulfilledJobs);
  })
);

// Job post creation via employers
employersRouter.post(
  '/jobs',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res: any) => {
    const employer = req.employer;
    const jobData = { ...req.body, employerId: employer.id, createdAt: new Date(), updatedAt: new Date() };
    const jobPost = await storage.createJobPost(jobData);
    res.status(201).json({ success: true, data: jobPost });
  })
);

employersRouter.get(
  '/profile',
  authenticateUser,
  requireRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = await storage.getEmployerByUserId(req.dbUser.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer profile not found' });
    }
    res.json(employer);
  })
);

employersRouter.patch(
  '/:id',
  authenticateUser,
  requireRole('employer'),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const employerId = parseInt(req.params.id);
    const employer = await storage.getEmployer(employerId);
    if (!employer || employer.userId !== user.id) {
      return res.status(404).json({ message: 'Employer not found or access denied' });
    }
    const updatedEmployer = await storage.updateEmployer(employerId, req.body);
    res.json(updatedEmployer);
  })
);

// Generic job-post endpoint
employersRouter.post(
  '/job-posts',
  authenticateUser,
  requireRole('employer'),
  asyncHandler(async (req: any, res) => {
    const user = req.dbUser;
    const employer = await storage.getEmployerByUserId(user.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer profile not found' });
    }
    const jobData: InsertJobPost = insertJobPostSchema.parse({ ...req.body, employerId: employer.id });
    const jobPost = await storage.createJobPost(jobData);
    res.json(jobPost);
  })
);
