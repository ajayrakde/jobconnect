import { Router } from 'express';
import { storage } from '../storage';
import { insertShortlistSchema } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { calculateMatchScore } from '../utils/matchingEngine';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export const adminRouter = Router();

adminRouter.get('/stats', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const stats = await storage.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

adminRouter.get('/jobs', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const jobs = await storage.getAllJobPosts();
    res.json(jobs);
  } catch (error) {
    console.error('Jobs fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

adminRouter.get('/unverified-employers', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const employers = await storage.getUnverifiedEmployers();
    res.json(employers);
  } catch (error) {
    console.error('Unverified employers fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch employers' });
  }
});

adminRouter.get('/unverified-candidates', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const candidates = await storage.getUnverifiedCandidates();
    res.json(candidates);
  } catch (error) {
    console.error('Unverified candidates fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch candidates' });
  }
});

adminRouter.patch('/employers/:id/verify', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const id = parseInt(req.params.id);
    const employer = await storage.verifyEmployer(id);
    res.json(employer);
  } catch (error) {
    console.error('Employer verify error:', error);
    res.status(400).json({ message: 'Failed to verify employer' });
  }
});

adminRouter.patch('/candidates/:id/verify', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const id = parseInt(req.params.id);
    const candidate = await storage.verifyCandidate(id);
    res.json(candidate);
  } catch (error) {
    console.error('Candidate verify error:', error);
    res.status(400).json({ message: 'Failed to verify candidate' });
  }
});

adminRouter.delete('/employers/:id', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const id = parseInt(req.params.id);
    const employer = await storage.softDeleteEmployer(id);
    res.json(employer);
  } catch (error) {
    console.error('Employer delete error:', error);
    res.status(400).json({ message: 'Failed to delete employer' });
  }
});

adminRouter.delete('/candidates/:id', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const id = parseInt(req.params.id);
    const candidate = await storage.softDeleteCandidate(id);
    res.json(candidate);
  } catch (error) {
    console.error('Candidate delete error:', error);
    res.status(400).json({ message: 'Failed to delete candidate' });
  }
});

adminRouter.delete('/jobs/:id', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const id = parseInt(req.params.id);
    const job = await storage.softDeleteJobPost(id);
    res.json(job);
  } catch (error) {
    console.error('Job delete error:', error);
    res.status(400).json({ message: 'Failed to delete job' });
  }
});

adminRouter.get('/candidates', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const candidates = await storage.getAllCandidates();
    res.json(candidates);
  } catch (error) {
    console.error('Candidates fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch candidates' });
  }
});

adminRouter.get('/jobs/:jobId/matches', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error) {
    console.error('Job matches fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch job matches' });
  }
});

adminRouter.get('/candidates/:candidateId/matches', authenticateUser, async (req: any, res) => {
  try {
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
  } catch (error) {
    console.error('Candidate matches fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch candidate matches' });
  }
});

adminRouter.post('/shortlist', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const shortlistData = insertShortlistSchema.parse({ ...req.body, shortlistedBy: user.id });
    const shortlist = await storage.createShortlist(shortlistData);
    res.json(shortlist);
  } catch (error) {
    console.error('Shortlist creation error:', error);
    res.status(400).json({ message: 'Failed to create shortlist' });
  }
});

adminRouter.get('/export/excel', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const data = await storage.getExportData();
    const buffer = await exportToExcel(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=lokaltalent-data.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Failed to export Excel file' });
  }
});

adminRouter.get('/export/pdf', authenticateUser, async (req: any, res) => {
  try {
    const user = await storage.getUserByFirebaseUid(req.user.uid);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const data = await storage.getExportData();
    const buffer = await exportToPDF(data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=lokaltalent-report.pdf');
    res.send(buffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Failed to export PDF file' });
  }
});

adminRouter.post('/login', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(401).json({ message: 'Invalid credentials or not an admin' });
  }
});
