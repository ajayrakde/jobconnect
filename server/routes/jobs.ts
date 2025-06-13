import { Router } from 'express';
import { storage } from '../storage';
import { insertJobPostSchema, type InsertJobPost } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';

export const jobsRouter = Router();

jobsRouter.patch('/:id/fulfill', authenticateUser, asyncHandler(async (req: any, res) => {
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
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job || job.employerId !== employer.id) {
    return res.status(404).json({ message: 'Job not found' });
  }
  const fulfilledJob = await storage.markJobAsFulfilled(jobId);
  res.json(fulfilledJob);
}));

jobsRouter.patch('/:id/activate', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer) {
    return res.status(404).json({ message: 'Employer profile not found' });
  }
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
}));

jobsRouter.patch('/:id/deactivate', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer) {
    return res.status(404).json({ message: 'Employer profile not found' });
  }
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
}));

jobsRouter.get('/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer || job.employerId !== employer.id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (employer.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Employer not verified' });
  }
  res.json(job);
}));

jobsRouter.get('/:id/applications', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer || job.employerId !== employer.id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (employer.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Employer not verified' });
  }
  const applications = await storage.getApplicationsByJob(jobId);
  res.json(applications);
}));

jobsRouter.put('/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  if (job.fulfilled) {
    return res.status(403).json({ message: 'Cannot edit fulfilled jobs' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer || job.employerId !== employer.id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  if (employer.profileStatus !== 'verified') {
    return res.status(403).json({ message: 'Employer not verified' });
  }
  const updateData = insertJobPostSchema.partial().parse(req.body) as Partial<InsertJobPost>;
  const updatedJob = await storage.updateJobPost(jobId, updateData);
  res.json(updatedJob);
}));

jobsRouter.post('/:id/clone', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'employer') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.id);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  const employer = await storage.getEmployerByUserId(user.id);
  if (!employer || job.employerId !== employer.id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobCode = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const cloneData = { ...job, title: `Copy of ${job.title}`, employerId: employer.id, jobCode, isActive: false };
  const clonedJob = await storage.createJobPost(cloneData);
  res.json(clonedJob);
}));
