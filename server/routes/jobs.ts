import { Router } from 'express';
import { storage } from '../storage';
import { insertJobPostSchema, type InsertJobPost } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { asyncHandler } from '../utils/asyncHandler';

export const jobsRouter = Router();

jobsRouter.patch(
  '/:id/fulfill',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || job.employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const fulfilledJob = await storage.markJobAsFulfilled(jobId);
    res.json(fulfilledJob);
  })
);

jobsRouter.patch(
  '/:id/activate',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || job.employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.fulfilled) {
      return res.status(400).json({ message: 'Cannot activate a fulfilled job' });
    }
    const activatedJob = await storage.activateJob(jobId);
    res.json(activatedJob);
  })
);

jobsRouter.patch(
  '/:id/deactivate',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || job.employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.fulfilled) {
      return res.status(400).json({ message: 'Cannot deactivate a fulfilled job' });
    }
    const deactivatedJob = await storage.deactivateJob(jobId);
    res.json(deactivatedJob);
  })
);

jobsRouter.get(
  '/:id',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || job.employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  })
);

jobsRouter.get(
  '/:id/applications',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || job.employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const applications = await storage.getApplicationsByJob(jobId);
    res.json(applications);
  })
);

jobsRouter.put(
  '/:id',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.fulfilled) {
      return res.status(403).json({ message: 'Cannot edit fulfilled jobs' });
    }
    if (job.employerId !== employer.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const updateData = insertJobPostSchema.partial().parse(req.body) as Partial<InsertJobPost>;
    const updatedJob = await storage.updateJobPost(jobId, updateData);
    res.json(updatedJob);
  })
);

jobsRouter.post(
  '/:id/clone',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || job.employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const jobCode = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const cloneData = { ...job, title: `Copy of ${job.title}`, employerId: employer.id, jobCode, isActive: false };
    const clonedJob = await storage.createJobPost(cloneData);
    res.json(clonedJob);
  })
);
