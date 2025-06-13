import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertEmployerSchema, insertJobPostSchema, type InsertEmployer, type InsertJobPost } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';

export const employersRouter = Router();

employersRouter.post('/', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error: any) {
    console.error('Employer creation error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Employer profile already exists', code: 'EMPLOYER_EXISTS' });
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data provided', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to create employer profile' });
  }
});

employersRouter.get('/stats', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

employersRouter.get('/jobs', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error) {
    console.error('Job posts fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch job posts' });
  }
});

employersRouter.get('/recent-jobs', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error) {
    console.error('Recent jobs fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch recent jobs' });
  }
});

employersRouter.get('/fulfilled-jobs', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error) {
    console.error('Fulfilled jobs fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch fulfilled jobs' });
  }
});

// Job post creation via employers
employersRouter.post('/jobs', authenticateUser, async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    console.error('Job creation error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid data provided', details: error.errors });
    }
    res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to create job post' });
  }
});

employersRouter.get('/profile', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const employer = await storage.getEmployerByUserId(user.id);
    if (!employer) {
      return res.status(404).json({ message: 'Employer profile not found' });
    }
    res.json(employer);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

employersRouter.patch('/:id', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json({ message: 'Failed to update profile' });
  }
});

// Generic job-post endpoint
employersRouter.post('/job-posts', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error) {
    console.error('Job post creation error:', error);
    res.status(400).json({ message: 'Failed to create job post' });
  }
});
