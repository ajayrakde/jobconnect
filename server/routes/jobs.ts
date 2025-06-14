import { Router } from 'express';
import { insertJobPostSchema, type InsertJobPost } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { requireVerifiedRole } from '../middleware/verifiedRole';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validation';
import { JobPostRepository } from '../repositories';
import { storage } from '../storage';

export const jobsRouter = Router();

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
    
    if (!job || job.employer.id !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const fulfilledJob = await JobPostRepository.update(jobId, { status: 'fulfilled' } as any);
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
    if (!job || job.employer.id !== employer.id) {
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
    if (!job || job.employer.id !== employer.id) {
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
    if (!job || job.employer.id !== employer.id) {
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
    if (!job || job.employer.id !== employer.id) {
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
    if (job.employer.id !== employer.id) {
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
    if (!job || job.employer.id !== employer.id) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const jobCode = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const cloneData = { ...job, title: `Copy of ${job.title}`, employerId: employer.id, jobCode, isActive: false };
    const clonedJob = await storage.createJobPost(cloneData);
    res.json(clonedJob);
  })
);
