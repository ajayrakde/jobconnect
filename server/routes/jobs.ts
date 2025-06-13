import { Router } from 'express';
import { storage } from '../storage';
import { insertJobPostSchema, type InsertJobPost } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { requireVerifiedRole } from '../middleware/verifiedRole';

export const jobsRouter = Router();

jobsRouter.patch(
  '/:id/fulfill',
  ...requireVerifiedRole('employer'),
  async (req: any, res) => {
    try {
      const employer = req.employer;
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      if (!job || job.employerId !== employer.id) {
        return res.status(404).json({ message: 'Job not found' });
      }
      const fulfilledJob = await storage.markJobAsFulfilled(jobId);
      res.json(fulfilledJob);
    } catch (error) {
      console.error('Job fulfillment error:', error);
      res.status(500).json({ message: 'Failed to mark job as fulfilled' });
    }
  }
);

jobsRouter.patch(
  '/:id/activate',
  ...requireVerifiedRole('employer'),
  async (req: any, res) => {
    try {
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
    } catch (error) {
      console.error('Job activation error:', error);
      res.status(500).json({ message: 'Failed to activate job' });
    }
  }
);

jobsRouter.patch(
  '/:id/deactivate',
  ...requireVerifiedRole('employer'),
  async (req: any, res) => {
    try {
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
    } catch (error) {
      console.error('Job deactivation error:', error);
      res.status(500).json({ message: 'Failed to deactivate job' });
    }
  }
);

jobsRouter.get(
  '/:id',
  ...requireVerifiedRole('employer'),
  async (req: any, res) => {
    try {
      const employer = req.employer;
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      if (!job || job.employerId !== employer.id) {
        return res.status(404).json({ message: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      console.error('Job fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch job details' });
    }
  }
);

jobsRouter.get(
  '/:id/applications',
  ...requireVerifiedRole('employer'),
  async (req: any, res) => {
    try {
      const employer = req.employer;
      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      if (!job || job.employerId !== employer.id) {
        return res.status(404).json({ message: 'Job not found' });
      }
      const applications = await storage.getApplicationsByJob(jobId);
      res.json(applications);
    } catch (error) {
      console.error('Applications fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  }
);

jobsRouter.put(
  '/:id',
  ...requireVerifiedRole('employer'),
  async (req: any, res) => {
    try {
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
    } catch (error: any) {
      console.error('Job update error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data provided', details: error.errors });
      }
      res.status(500).json({ message: 'Failed to update job' });
    }
  }
);

jobsRouter.post(
  '/:id/clone',
  ...requireVerifiedRole('employer'),
  async (req: any, res) => {
    try {
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
    } catch (error) {
      console.error('Job clone error:', error);
      res.status(500).json({ message: 'Failed to clone job' });
    }
  }
);
