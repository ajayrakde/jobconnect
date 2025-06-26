import { Router } from 'express';
import { insertEmployerSchema, insertJobPostSchema } from '@shared/zod';
import { generateJobCode } from '../utils/jobCodeGenerator';
import type { InsertEmployer, InsertJobPost } from '@shared/types';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validation';
import { EmployerRepository, JobPostRepository } from '../repositories';
import { storage } from '../storage';
import { isValidTransition, canPerformAction } from '@shared/utils/jobStatus';

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
    const jobData = insertJobPostSchema.parse({
      ...req.body,
      employerId: employer.id,
      jobCode: generateJobCode(),
      jobStatus: 'PENDING',
    }) as InsertJobPost;
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
    const jobData: InsertJobPost = insertJobPostSchema.parse({
      ...req.body,
      employerId: employer.id,
      jobCode: generateJobCode(),
      jobStatus: 'PENDING',
    });
    const jobPost = await storage.createJobPost(jobData);
    res.json(jobPost);
  })
);

// Routes moved from jobsRouter

employersRouter.get(
  '/jobs/:id',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || (job as any).employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  })
);

employersRouter.get(
  '/candidates/:id',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const candidateId = parseInt(req.params.id);
    const candidate = await storage.getCandidate(candidateId);
    if (!candidate || candidate.deleted || candidate.profileStatus !== 'verified') {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    const { address, emergencyContact, dependents, dateOfBirth, ...rest } = candidate as any;
    res.json(rest);
  })
);

employersRouter.put(
  '/jobs/:id',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (!canPerformAction('employer', job.jobStatus as any, 'edit', job.deleted)) {
      return res.status(403).json({ message: 'Cannot edit fulfilled or deleted jobs' });
    }
    if ((job as any).employerId !== employer.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updateData = insertJobPostSchema.partial().parse(req.body) as Partial<InsertJobPost>;
    const updatedJob = await storage.updateJobPost(jobId, updateData);
    res.json(updatedJob);
  })
);

employersRouter.patch(
  '/jobs/:id/fulfill',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || (job as any).employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (!isValidTransition(job.jobStatus as any, 'FULFILLED', job.deleted)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }
    const fulfilledJob = await storage.markJobAsFulfilled(jobId);
    res.json(fulfilledJob);
  })
);

employersRouter.patch(
  '/jobs/:id/activate',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || (job as any).employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (!canPerformAction('employer', job.jobStatus as any, 'activate', job.deleted)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }
    if (!isValidTransition(job.jobStatus as any, 'ACTIVE', job.deleted)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }
    const activatedJob = await storage.activateJob(jobId);
    res.json(activatedJob);
  })
);

employersRouter.patch(
  '/jobs/:id/deactivate',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || (job as any).employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (!isValidTransition(job.jobStatus as any, 'PENDING', job.deleted)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }
    const deactivatedJob = await storage.deactivateJob(jobId);
    res.json(deactivatedJob);
  })
);

employersRouter.get(
  '/jobs/:id/applications',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || (job as any).employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const applications = await storage.getApplicationsByJobForEmployer(jobId);
    res.json(applications);
  })
);

employersRouter.get(
  '/applications',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const applications = await storage.getApplicationsByEmployer(employer.id);
    res.json(applications);
  })
);

employersRouter.post(
  '/jobs/:id/clone',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || (job as any).employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const jobCode = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const cloneData = { ...job, title: `Copy of ${job.title}`, employerId: employer.id, jobCode, jobStatus: 'PENDING' };
    const clonedJob = await storage.createJobPost(cloneData);
    res.json(clonedJob);
  })
);
