import { Router } from 'express';
import { insertJobPostSchema } from '@shared/zod';
import type { InsertJobPost } from '@shared/types';
import { getJobStatus } from '@shared/utils/jobStatus';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validation';
import { JobPostRepository } from '../repositories';
import { isValidTransition, canPerformAction } from '@shared/utils/jobStatus';
import { storage } from '../storage';

export const jobsRouter = Router();

jobsRouter.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const jobs = await storage.getPublicJobPosts();
    res.json(jobs);
  })
);

/**
 * @swagger
 * /api/jobs/{id}/fulfill:
 *   patch:
 *     summary: Mark a job post as fulfilled
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Job marked as fulfilled successfully
 *       404:
 *         description: Job not found
 */
jobsRouter.patch(
  '/:id/fulfill',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await JobPostRepository.findById(jobId);

    if (!job || (job as any).employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!isValidTransition(job.jobStatus as any, 'FULFILLED', job.deleted)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    const fulfilledJob = await JobPostRepository.update(jobId, { jobStatus: 'FULFILLED' } as any);
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
    if (!job || (job as any).employerId !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (!isValidTransition(job.jobStatus as any, 'ACTIVE', job.deleted)) {
      return res.status(400).json({ message: 'Invalid status transition' });
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

jobsRouter.get(
  '/:id',
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

jobsRouter.get(
  '/:id/applications',
  ...requireVerifiedRole('employer'),
  asyncHandler(async (req: any, res) => {
    const employer = req.employer;
    const jobId = parseInt(req.params.id);
    const job = await storage.getJobPost(jobId);
    if (!job || (job as any).employerId !== employer.id) {
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

jobsRouter.post(
  '/:id/clone',
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
