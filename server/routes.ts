// @ts-nocheck
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifyFirebaseToken } from "./utils/firebase-admin";
import { calculateMatchScore } from "./utils/matchingEngine";
import { exportToExcel, exportToPDF } from "./utils/exportUtils";
import { insertUserSchema, insertCandidateSchema, insertEmployerSchema, insertJobPostSchema, insertApplicationSchema, insertShortlistSchema, type InsertUser, type InsertCandidate, type InsertEmployer, type InsertJobPost } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to verify Firebase token and extract user info
  const authenticateUser = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decodedToken = await verifyFirebaseToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData: InsertUser = insertUserSchema.parse(req.body);
      
      // Check if user already exists by Firebase UID
      const existingUserByUid = await storage.getUserByFirebaseUid(userData.firebaseUid);
      if (existingUserByUid) {
        return res.json(existingUserByUid);
      }

      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(409).json({ 
          message: "Email already registered",
          code: "EMAIL_EXISTS" 
        });
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      if (error.code === '23505' && error.constraint === 'users_email_unique') {
        return res.status(409).json({ 
          message: "Email already registered",
          code: "EMAIL_EXISTS" 
        });
      }
      
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.get("/api/auth/profile", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let profileData: any = { ...user };
      
      if (user.role === "candidate") {
        const candidate = await storage.getCandidateByUserId(user.id);
        profileData.candidate = candidate;
      } else if (user.role === "employer") {
        const employer = await storage.getEmployerByUserId(user.id);
        profileData.employer = employer;
      }

      res.json(profileData);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Candidate routes
  app.get("/api/candidates/profile", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "candidate") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidate = await storage.getCandidateByUserId(user.id);
      if (!candidate || candidate.deleted) {
        return res.status(404).json({ message: "Candidate profile not found" });
      }
      if (candidate.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Candidate not verified" });
      }

      res.json(candidate);
    } catch (error) {
      console.error("Candidate profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch candidate profile" });
    }
  });

  app.patch("/api/candidates/:id", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "candidate") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidate = await storage.getCandidateByUserId(user.id);
      if (!candidate || candidate.id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedCandidate = await storage.updateCandidate(candidate.id, req.body);
      res.json(updatedCandidate);
    } catch (error) {
      console.error("Candidate update error:", error);
      res.status(400).json({ message: "Failed to update candidate profile" });
    }
  });

  app.post("/api/candidates", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "candidate") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidateData: InsertCandidate = insertCandidateSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const candidate = await storage.createCandidate(candidateData);
      res.json(candidate);
    } catch (error) {
      console.error("Candidate creation error:", error);
      res.status(400).json({ message: "Failed to create candidate profile" });
    }
  });

  app.get("/api/candidates/stats", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "candidate") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidate = await storage.getCandidateByUserId(user.id);
      if (!candidate || candidate.deleted) {
        return res.status(404).json({ message: "Candidate profile not found" });
      }
      if (candidate.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Candidate not verified" });
      }

      const stats = await storage.getCandidateStats(candidate.id);
      res.json(stats);
    } catch (error) {
      console.error("Stats fetch error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/candidates/recommended-jobs", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "candidate") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidate = await storage.getCandidateByUserId(user.id);
      if (!candidate || candidate.deleted) {
        return res.status(404).json({ message: "Candidate profile not found" });
      }
      if (candidate.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Candidate not verified" });
      }

      const jobs = await storage.getRecommendedJobs(candidate.id);
      res.json(jobs);
    } catch (error) {
      console.error("Recommended jobs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch recommended jobs" });
    }
  });

  app.get("/api/candidates/applications", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "candidate") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidate = await storage.getCandidateByUserId(user.id);
      if (!candidate || candidate.deleted) {
        return res.status(404).json({ message: "Candidate profile not found" });
      }
      if (candidate.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Candidate not verified" });
      }

      const applications = await storage.getCandidateApplications(candidate.id);
      res.json(applications);
    } catch (error) {
      console.error("Applications fetch error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Employer routes
  app.post("/api/employers", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if employer profile already exists
      const existingEmployer = await storage.getEmployerByUserId(user.id);
      if (existingEmployer) {
        return res.status(409).json({ 
          message: "Employer profile already exists",
          code: "EMPLOYER_EXISTS" 
        });
      }

      const employerData: InsertEmployer = insertEmployerSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const employer = await storage.createEmployer(employerData);
      res.json(employer);
    } catch (error: any) {
      console.error("Employer creation error:", error);
      
      // Handle specific database errors
      if (error.code === '23505') {
        return res.status(409).json({ 
          message: "Employer profile already exists",
          code: "EMPLOYER_EXISTS" 
        });
      }
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid data provided",
          details: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create employer profile" });
    }
  });

  app.get("/api/employers/stats", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer || employer.deleted) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      const stats = await storage.getEmployerStats(employer.id);
      res.json(stats);
    } catch (error) {
      console.error("Stats fetch error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/employers/jobs", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer || employer.deleted) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      const jobPosts = await storage.getJobPostsByEmployer(employer.id);
      res.json(jobPosts);
    } catch (error) {
      console.error("Job posts fetch error:", error);
      res.status(500).json({ message: "Failed to fetch job posts" });
    }
  });

  app.get("/api/employers/recent-jobs", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      const recentJobs = await storage.getActiveUnfulfilledJobsByEmployer(employer.id);
      res.json(recentJobs.slice(0, 5));
    } catch (error) {
      console.error("Recent jobs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch recent jobs" });
    }
  });

  app.get("/api/employers/fulfilled-jobs", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      const fulfilledJobs = await storage.getFulfilledJobsByEmployer(employer.id);
      res.json(fulfilledJobs);
    } catch (error) {
      console.error("Fulfilled jobs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch fulfilled jobs" });
    }
  });

  app.patch("/api/jobs/:id/fulfill", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }
      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      
      if (!job || job.employerId !== employer.id) {
        return res.status(404).json({ message: "Job not found" });
      }

      const fulfilledJob = await storage.markJobAsFulfilled(jobId);
      res.json(fulfilledJob);
    } catch (error) {
      console.error("Job fulfillment error:", error);
      res.status(500).json({ message: "Failed to mark job as fulfilled" });
    }
  });

  app.patch("/api/jobs/:id/activate", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      
      if (!job || job.employerId !== employer.id) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Prevent activation of fulfilled jobs
      if (job.fulfilled) {
        return res.status(400).json({ message: "Cannot activate a fulfilled job" });
      }

      const activatedJob = await storage.activateJob(jobId);
      res.json(activatedJob);
    } catch (error) {
      console.error("Job activation error:", error);
      res.status(500).json({ message: "Failed to activate job" });
    }
  });

  app.patch("/api/jobs/:id/deactivate", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      
      if (!job || job.employerId !== employer.id) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Prevent deactivation of fulfilled jobs
      if (job.fulfilled) {
        return res.status(400).json({ message: "Cannot deactivate a fulfilled job" });
      }

      const deactivatedJob = await storage.deactivateJob(jobId);
      res.json(deactivatedJob);
    } catch (error) {
      console.error("Job deactivation error:", error);
      res.status(500).json({ message: "Failed to deactivate job" });
    }
  });

  app.get("/api/employers/profile", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      res.json(employer);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/employers/:id", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employerId = parseInt(req.params.id);
      const employer = await storage.getEmployer(employerId);
      
      if (!employer || employer.userId !== user.id) {
        return res.status(404).json({ message: "Employer not found or access denied" });
      }

      const updatedEmployer = await storage.updateEmployer(employerId, req.body);
      res.json(updatedEmployer);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // Job posts routes
  app.post("/api/job-posts", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      const jobData: InsertJobPost = insertJobPostSchema.parse({
        ...req.body,
        employerId: employer.id,
      });
      
      const jobPost = await storage.createJobPost(jobData);
      res.json(jobPost);
    } catch (error) {
      console.error("Job post creation error:", error);
      res.status(400).json({ message: "Failed to create job post" });
    }
  });

  // Employer-specific job creation endpoint
  app.post("/api/employers/jobs", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer) {
        return res.status(404).json({ message: "Employer profile not found" });
      }

      // Generate job code
      const jobCode = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const jobData: InsertJobPost = insertJobPostSchema.parse({
        ...req.body,
        employerId: employer.id,
        jobCode,
      });
      
      const jobPost = await storage.createJobPost(jobData);
      res.json(jobPost);
    } catch (error: any) {
      console.error("Job creation error:", error);
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid data provided",
          details: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create job post" });
    }
  });

  // Get specific job details
  app.get("/api/jobs/:id", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Verify the job belongs to the current employer
      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer || job.employerId !== employer.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }
      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      res.json(job);
    } catch (error) {
      console.error("Job fetch error:", error);
      res.status(500).json({ message: "Failed to fetch job details" });
    }
  });

  // Get applications for a specific job
  app.get("/api/jobs/:id/applications", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Verify the job belongs to the current employer
      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer || job.employerId !== employer.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      const applications = await storage.getApplicationsByJob(jobId);
      res.json(applications);
    } catch (error) {
      console.error("Applications fetch error:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Update specific job
  app.put("/api/jobs/:id", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Prevent editing fulfilled jobs
      if (job.fulfilled) {
        return res.status(403).json({ message: "Cannot edit fulfilled jobs" });
      }

      // Verify the job belongs to the current employer
      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer || job.employerId !== employer.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (employer.profileStatus !== 'verified') {
        return res.status(403).json({ message: "Employer not verified" });
      }

      const updateData = insertJobPostSchema.partial().parse(req.body) as Partial<InsertJobPost>;
      const updatedJob = await storage.updateJobPost(jobId, updateData);
      
      res.json(updatedJob);
    } catch (error: any) {
      console.error("Job update error:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid data provided",
          details: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Clone job
  app.post("/api/jobs/:id/clone", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "employer") {
        return res.status(403).json({ message: "Access denied" });
      }

      const jobId = parseInt(req.params.id);
      const job = await storage.getJobPost(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Verify the job belongs to the current employer
      const employer = await storage.getEmployerByUserId(user.id);
      if (!employer || job.employerId !== employer.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate new job code for the clone
      const jobCode = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create clone with new job code and title prefix
      const cloneData = {
        title: `Copy of ${job.title}`,
        description: job.description,
        minQualification: job.minQualification,
        experienceRequired: job.experienceRequired,
        skills: job.skills,
        salaryRange: job.salaryRange,
        location: job.location,
        responsibilities: job.responsibilities,
        vacancy: job.vacancy,
        employerId: employer.id,
        jobCode,
        isActive: false, // Clone starts as inactive
      };
      
      const clonedJob = await storage.createJobPost(cloneData);
      res.json(clonedJob);
    } catch (error) {
      console.error("Job clone error:", error);
      res.status(500).json({ message: "Failed to clone job" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats fetch error:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/jobs", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const jobs = await storage.getAllJobPosts();
      res.json(jobs);
    } catch (error) {
      console.error("Jobs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/admin/unverified-employers", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const employers = await storage.getUnverifiedEmployers();
      res.json(employers);
    } catch (error) {
      console.error("Unverified employers fetch error:", error);
      res.status(500).json({ message: "Failed to fetch employers" });
    }
  });

  app.get("/api/admin/unverified-candidates", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidates = await storage.getUnverifiedCandidates();
      res.json(candidates);
    } catch (error) {
      console.error("Unverified candidates fetch error:", error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  app.patch("/api/admin/employers/:id/verify", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      const employer = await storage.verifyEmployer(id);
      res.json(employer);
    } catch (error) {
      console.error("Employer verify error:", error);
      res.status(400).json({ message: "Failed to verify employer" });
    }
  });

  app.patch("/api/admin/candidates/:id/verify", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      const candidate = await storage.verifyCandidate(id);
      res.json(candidate);
    } catch (error) {
      console.error("Candidate verify error:", error);
      res.status(400).json({ message: "Failed to verify candidate" });
    }
  });

  app.delete("/api/admin/employers/:id", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      const employer = await storage.softDeleteEmployer(id);
      res.json(employer);
    } catch (error) {
      console.error("Employer delete error:", error);
      res.status(400).json({ message: "Failed to delete employer" });
    }
  });

  app.delete("/api/admin/candidates/:id", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      const candidate = await storage.softDeleteCandidate(id);
      res.json(candidate);
    } catch (error) {
      console.error("Candidate delete error:", error);
      res.status(400).json({ message: "Failed to delete candidate" });
    }
  });

  app.delete("/api/admin/jobs/:id", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const id = parseInt(req.params.id);
      const job = await storage.softDeleteJobPost(id);
      res.json(job);
    } catch (error) {
      console.error("Job delete error:", error);
      res.status(400).json({ message: "Failed to delete job" });
    }
  });

  app.get("/api/admin/candidates", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidates = await storage.getAllCandidates();
      res.json(candidates);
    } catch (error) {
      console.error("Candidates fetch error:", error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  app.get("/api/admin/jobs/:jobId/matches", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJobPost(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const candidates = await storage.getAllCandidates();
      const matches = candidates.map(candidate => ({
        candidateId: candidate.id,
        candidate,
        score: calculateMatchScore(job, candidate),
        skillsMatch: Array.isArray(candidate.skills) 
          ? (candidate.skills as string[]).map((skill: string) => ({
              name: skill,
              matches: Array.isArray(job.skills) ? (job.skills as string[]).includes(skill) : false
            }))
          : [],
        experienceMatch: true, // Simplified for demo
        salaryMatch: true, // Simplified for demo
      })).sort((a, b) => b.score - a.score).slice(0, 10);

      res.json(matches);
    } catch (error) {
      console.error("Job matches fetch error:", error);
      res.status(500).json({ message: "Failed to fetch job matches" });
    }
  });

  app.get("/api/admin/candidates/:candidateId/matches", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const candidateId = parseInt(req.params.candidateId);
      const candidate = await storage.getCandidate(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      const jobs = await storage.getAllJobPosts();
      const matches = jobs.map(job => ({
        jobId: job.id,
        job,
        score: calculateMatchScore(job, candidate),
      })).sort((a, b) => b.score - a.score).slice(0, 10);

      res.json(matches);
    } catch (error) {
      console.error("Candidate matches fetch error:", error);
      res.status(500).json({ message: "Failed to fetch candidate matches" });
    }
  });

  app.post("/api/admin/shortlist", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const shortlistData = insertShortlistSchema.parse({
        ...req.body,
        shortlistedBy: user.id,
      });
      
      const shortlist = await storage.createShortlist(shortlistData);
      res.json(shortlist);
    } catch (error) {
      console.error("Shortlist creation error:", error);
      res.status(400).json({ message: "Failed to create shortlist" });
    }
  });

  // Export routes
  app.get("/api/admin/export/excel", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = await storage.getExportData();
      const buffer = await exportToExcel(data);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=lokaltalent-data.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Excel export error:", error);
      res.status(500).json({ message: "Failed to export Excel file" });
    }
  });

  app.get("/api/admin/export/pdf", authenticateUser, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const data = await storage.getExportData();
      const buffer = await exportToPDF(data);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=lokaltalent-report.pdf');
      res.send(buffer);
    } catch (error) {
      console.error("PDF export error:", error);
      res.status(500).json({ message: "Failed to export PDF file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
