import { Router } from 'express';
import { storage } from '../storage';
import { insertShortlistSchema } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { calculateMatchScore } from '../utils/matchingEngine';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { asyncHandler } from '../middleware/asyncHandler';

export const adminRouter = Router();

adminRouter.get('/stats', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const stats = await storage.getAdminStats();
  res.json(stats);
}));

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

adminRouter.patch('/employers/:id/verify', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const id = parseInt(req.params.id);
  const employer = await storage.verifyEmployer(id);
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

adminRouter.get('/candidates', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const candidates = await storage.getAllCandidates();
  res.json(candidates);
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
