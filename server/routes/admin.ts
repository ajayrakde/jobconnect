import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { requireRole } from '../middleware/authorization';
import { asyncHandler } from '../utils/asyncHandler';
import { validateQuery } from '../middleware/validation';
import { z } from 'zod';
import { AdminRepository } from '../repositories';
import { calculateMatchScore } from '../utils/matchingEngine';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { storage } from '../storage';
import { insertShortlistSchema } from '@shared/zod';
import { verifyFirebaseToken } from '../utils/firebase-admin';

// Validation schemas
const searchQuerySchema = z.object({
  type: z.enum(['candidate', 'employer', 'job']).optional(),
  q: z.string().min(1),
  sort: z.enum(['latest', 'relevance']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export const adminRouter = Router();

/**
 * @swagger
 * /api/admin/search:
 *   get:
 *     summary: Search across candidates, employers, and jobs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  '/search',
  authenticateUser,
  requireRole('admin'),
  validateQuery(searchQuerySchema),
  asyncHandler(async (req, res) => {
    const { type, q = '', sort = 'latest', page = 1, limit = 20 } = req.query;
    const results = await AdminRepository.search({
      type,
      query: q,
      sort,
      page,
      limit
    });
    res.json(results);
  })
);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
adminRouter.get(
  '/stats',
  authenticateUser,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const stats = await AdminRepository.getStats();
    res.json(stats);
  })
);

adminRouter.get('/jobs', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobs = await storage.getAllJobPosts();
  res.json(jobs);
}));

adminRouter.get('/unverified-employers', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const employers = await storage.getUnverifiedEmployers();
  res.json(employers);
}));

adminRouter.get('/unverified-candidates', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidates = await storage.getUnverifiedCandidates();
  res.json(candidates);
}));

// Unified endpoint for admin verifications
adminRouter.get('/verifications/:type', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const type = req.params.type;
  if (type === 'candidate') {
    return res.json(await storage.getUnverifiedCandidates());
  }
  if (type === 'employer') {
    return res.json(await storage.getUnverifiedEmployers());
  }
  if (type === 'job') {
    return res.json(await storage.getInactiveJobPosts());
  }
  res.status(400).json({ message: 'Invalid type' });
}));

adminRouter.patch('/employers/:id/verify', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.verifyEmployer(id);
  res.json(employer);
}));

adminRouter.patch('/employers/:id/approve', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.verifyEmployer(id);
  res.json(employer);
}));

adminRouter.patch('/employers/:id/reject', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.rejectEmployer(id);
  res.json(employer);
}));

adminRouter.patch('/employers/:id/hold', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.holdEmployer(id);
  res.json(employer);
}));

adminRouter.patch('/candidates/:id/verify', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.verifyCandidate(id);
  res.json(candidate);
}));

adminRouter.patch('/candidates/:id/approve', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.verifyCandidate(id);
  res.json(candidate);
}));

adminRouter.patch('/candidates/:id/reject', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.rejectCandidate(id);
  res.json(candidate);
}));

adminRouter.patch('/candidates/:id/hold', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.holdCandidate(id);
  res.json(candidate);
}));

adminRouter.delete('/employers/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.softDeleteEmployer(id);
  res.json(employer);
}));

adminRouter.delete('/candidates/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.softDeleteCandidate(id);
  res.json(candidate);
}));

adminRouter.delete('/jobs/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const job = await storage.softDeleteJobPost(id);
  res.json(job);
}));

adminRouter.patch('/jobs/:id/approve', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const job = await storage.approveJob(id);
  res.json(job);
}));

adminRouter.patch('/jobs/:id/reject', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const job = await storage.softDeleteJobPost(id);
  res.json(job);
}));

adminRouter.patch('/jobs/:id/hold', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const job = await storage.holdJob(id);
  res.json(job);
}));

adminRouter.get('/candidates', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidates = await storage.getAllCandidates();
  res.json(candidates);
}));

adminRouter.get('/active-candidates', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidates = await storage.getMostActiveCandidates(10);
  res.json(candidates);
}));

adminRouter.get('/candidates/:id', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const candidate = await storage.getCandidate(id);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }
  res.json(candidate);
}));

adminRouter.get('/jobs/:jobId/matches', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const jobId = parseInt(req.params.jobId);
  const job = await storage.getJobPost(jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  const candidates = await storage.getAllCandidates();
  const matches = candidates.map(candidate => ({
      candidateId: candidate.id,
      candidate,
      score: calculateMatchScore(job, candidate),
      skillsMatch: Array.isArray(candidate.skills)
        ? (candidate.skills as string[]).map(skill => ({
            name: skill,
            matches: Array.isArray(job.skills) ? (job.skills as string[]).includes(skill) : false,
          }))
        : [],
      experienceMatch: true,
      salaryMatch: true,
    })).sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(matches);
}));

adminRouter.get('/candidates/:candidateId/matches', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidateId = parseInt(req.params.candidateId);
  const candidate = await storage.getCandidate(candidateId);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found' });
  }
  const jobs = await storage.getAllJobPosts();
  const matches = jobs.map(job => ({
    jobId: job.id,
    job,
    score: calculateMatchScore(job, candidate),
  })).sort((a, b) => b.score - a.score).slice(0, 10);
  res.json(matches);
}));

adminRouter.post('/shortlist', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const shortlistData = insertShortlistSchema.parse({ ...req.body, shortlistedBy: user.id });
  const shortlist = await storage.createShortlist(shortlistData);
  res.json(shortlist);
}));

adminRouter.get('/export/excel', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const data = await storage.getExportData();
  const buffer = await exportToExcel(data);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=lokaltalent-data.xlsx');
  res.send(buffer);
}));

adminRouter.get('/export/pdf', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const data = await storage.getExportData();
  const buffer = await exportToPDF(data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=lokaltalent-report.pdf');
  res.send(buffer);
}));

adminRouter.post('/login', asyncHandler(async (req, res) => {
  const { firebaseToken } = req.body;
  if (!firebaseToken) {
    return res.status(400).json({ message: 'Missing Firebase token' });
  }
  const decodedToken = await verifyFirebaseToken(firebaseToken);
  const user = await storage.getUserByFirebaseUid(decodedToken.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: not an admin' });
  }
  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}));
