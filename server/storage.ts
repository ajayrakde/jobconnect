import { 
  User, InsertUser, Candidate, InsertCandidate, Employer, InsertEmployer,
  JobPost, InsertJobPost, Application, InsertApplication, Shortlist, InsertShortlist,
  MatchScore, users, candidates, employers, jobPosts, applications, shortlists, matchScores
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;

  // Candidate operations
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidateByUserId(userId: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate>;
  getAllCandidates(): Promise<Candidate[]>;
  getCandidateStats(candidateId: number): Promise<any>;
  getRecommendedJobs(candidateId: number): Promise<any[]>;
  getCandidateApplications(candidateId: number): Promise<any[]>;

  // Employer operations
  getEmployer(id: number): Promise<Employer | undefined>;
  getEmployerByUserId(userId: number): Promise<Employer | undefined>;
  createEmployer(employer: InsertEmployer): Promise<Employer>;
  updateEmployer(id: number, updates: Partial<Employer>): Promise<Employer>;

  // Job post operations
  getJobPost(id: number): Promise<JobPost | undefined>;
  createJobPost(jobPost: InsertJobPost): Promise<JobPost>;
  updateJobPost(id: number, updates: Partial<JobPost>): Promise<JobPost>;
  getJobPostsByEmployer(employerId: number): Promise<JobPost[]>;
  getAllJobPosts(): Promise<JobPost[]>;
  getEmployerStats(employerId: number): Promise<any>;
  markJobAsFulfilled(jobId: number): Promise<JobPost>;
  activateJob(jobId: number): Promise<JobPost>;
  deactivateJob(jobId: number): Promise<JobPost>;
  getFulfilledJobsByEmployer(employerId: number): Promise<JobPost[]>;
  getActiveUnfulfilledJobsByEmployer(employerId: number): Promise<JobPost[]>;

  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationsByCandidate(candidateId: number): Promise<Application[]>;
  getApplicationsByJob(jobPostId: number): Promise<Application[]>;

  // Shortlist operations
  createShortlist(shortlist: InsertShortlist): Promise<Shortlist>;
  getShortlistsByJob(jobPostId: number): Promise<Shortlist[]>;

  // Match score operations
  saveMatchScore(jobPostId: number, candidateId: number, score: number, factors: any): Promise<MatchScore>;
  getMatchScore(jobPostId: number, candidateId: number): Promise<MatchScore | undefined>;

  // Admin operations
  getAdminStats(): Promise<any>;
  getExportData(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // Candidate operations
  async getCandidate(id: number): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate || undefined;
  }

  async getCandidateByUserId(userId: number): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.userId, userId));
    return candidate || undefined;
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const [candidate] = await db
      .insert(candidates)
      .values({
        ...insertCandidate,
        profileComplete: true,
      })
      .returning();
    return candidate;
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate> {
    const [candidate] = await db
      .update(candidates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    if (!candidate) throw new Error("Candidate not found");
    return candidate;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates);
  }

  async getCandidateStats(candidateId: number): Promise<any> {
    const candidateApplications = await db.select().from(applications).where(eq(applications.candidateId, candidateId));
    const interviews = candidateApplications.filter(app => app.status === "interviewed").length;
    
    return {
      profileViews: Math.floor(Math.random() * 100) + 20,
      applications: candidateApplications.length,
      interviews,
      matchScore: Math.floor(Math.random() * 20) + 80,
    };
  }

  async getRecommendedJobs(candidateId: number): Promise<any[]> {
    // Get candidate profile
    const candidate = await this.getCandidate(candidateId);
    if (!candidate) return [];

    // Get jobs from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const allJobs = await db.select({
      id: jobPosts.id,
      jobCode: jobPosts.jobCode,
      title: jobPosts.title,
      description: jobPosts.description,
      minQualification: jobPosts.minQualification,
      experienceRequired: jobPosts.experienceRequired,
      skills: jobPosts.skills,
      salaryRange: jobPosts.salaryRange,
      location: jobPosts.location,
      createdAt: jobPosts.createdAt,
      employerId: jobPosts.employerId,
    })
    .from(jobPosts)
    .where(and(
      gte(jobPosts.createdAt, ninetyDaysAgo),
      eq(jobPosts.isActive, true),
      eq(jobPosts.fulfilled, false)
    ));

    // Get employer names
    const jobsWithEmployers = [];
    for (const job of allJobs) {
      const employer = await this.getEmployer(job.employerId);
      jobsWithEmployers.push({
        ...job,
        employer: {
          organizationName: employer?.organizationName || "Unknown Organization"
        }
      });
    }

    // Calculate compatibility scores
    const jobsWithScores = jobsWithEmployers.map(job => {
      const { score, factors } = this.calculateJobCompatibility(job, candidate);
      return {
        ...job,
        compatibilityScore: Math.round(score),
        matchFactors: {
          skillsScore: Math.round(factors.skillsScore),
          experienceScore: Math.round(factors.experienceScore),
          salaryScore: Math.round(factors.salaryScore),
          locationScore: Math.round(factors.locationScore),
          qualificationScore: Math.round(factors.qualificationScore),
        }
      };
    });

    // Sort by compatibility (desc) then by date (desc)
    jobsWithScores.sort((a, b) => {
      if (a.compatibilityScore !== b.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Filter top 10% by compatibility score
    if (jobsWithScores.length === 0) return [];
    
    const topPercentileCount = Math.max(1, Math.ceil(jobsWithScores.length * 0.1));
    return jobsWithScores.slice(0, topPercentileCount);
  }

  private calculateJobCompatibility(job: any, candidate: any): { score: number, factors: any } {
    const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
    const candidateExperience = Array.isArray(candidate.experience) ? candidate.experience : [];
    const candidateQualifications = Array.isArray(candidate.qualifications) ? candidate.qualifications : [];

    // Skills matching
    const jobSkills = job.skills ? job.skills.toLowerCase().split(',').map((s: string) => s.trim()) : [];
    const matchingSkills = candidateSkills.filter((skill: string) => 
      jobSkills.some((jobSkill: string) => jobSkill.includes(skill.toLowerCase()))
    );
    const skillsScore = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 100 : 50;

    // Experience matching
    const totalExperience = candidateExperience.reduce((total: number, exp: any) => {
      const duration = parseInt(exp.duration?.toString() || '0');
      return total + (isNaN(duration) ? 0 : duration);
    }, 0);
    
    const requiredExperience = parseInt(job.experienceRequired?.match(/\d+/)?.[0] || '0');
    const experienceScore = requiredExperience > 0 
      ? Math.min((totalExperience / requiredExperience) * 100, 100)
      : totalExperience > 0 ? 100 : 50;

    // Salary matching
    const expectedSalary = candidate.expectedSalary || 0;
    const salaryRange = job.salaryRange || '';
    const salaryNumbers = salaryRange.match(/\d+/g);
    const maxSalary = salaryNumbers ? parseInt(salaryNumbers[salaryNumbers.length - 1]) : 0;
    const salaryScore = expectedSalary > 0 && maxSalary > 0
      ? Math.max(0, 100 - Math.abs(expectedSalary - maxSalary) / maxSalary * 100)
      : 50;

    // Location matching
    const candidateLocation = candidate.address?.toLowerCase() || '';
    const jobLocation = job.location?.toLowerCase() || '';
    const locationScore = candidateLocation && jobLocation
      ? (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation) ? 100 : 30)
      : 50;

    // Qualification matching
    const highestQualification = candidateQualifications.length > 0 
      ? candidateQualifications[candidateQualifications.length - 1]?.degree?.toLowerCase() || ''
      : '';
    const requiredQualification = job.minQualification?.toLowerCase() || '';
    
    const qualificationLevels = ['high school', 'diploma', 'bachelor', 'master', 'phd'];
    const candidateLevel = qualificationLevels.findIndex(level => highestQualification.includes(level));
    const requiredLevel = qualificationLevels.findIndex(level => requiredQualification.includes(level));
    
    const qualificationScore = candidateLevel >= 0 && requiredLevel >= 0
      ? candidateLevel >= requiredLevel ? 100 : Math.max(0, 100 - (requiredLevel - candidateLevel) * 25)
      : 50;

    // Overall score (weighted average)
    const overallScore = (
      skillsScore * 0.3 +
      experienceScore * 0.25 +
      qualificationScore * 0.2 +
      salaryScore * 0.15 +
      locationScore * 0.1
    );

    return {
      score: overallScore,
      factors: {
        skillsScore,
        experienceScore,
        salaryScore,
        locationScore,
        qualificationScore
      }
    };
  }

  async getCandidateApplications(candidateId: number): Promise<any[]> {
    const candidateApplications = await db.select().from(applications).where(eq(applications.candidateId, candidateId));
    const applicationsWithJobs = [];
    
    for (const app of candidateApplications) {
      const [job] = await db.select().from(jobPosts).where(eq(jobPosts.id, app.jobPostId));
      applicationsWithJobs.push({
        ...app,
        jobTitle: job?.title || "Unknown Job",
        company: "Sample Company",
        appliedDate: app.appliedAt?.toDateString() || "Recently",
      });
    }
    return applicationsWithJobs;
  }

  // Employer operations
  async getEmployer(id: number): Promise<Employer | undefined> {
    const [employer] = await db.select().from(employers).where(eq(employers.id, id));
    return employer || undefined;
  }

  async getEmployerByUserId(userId: number): Promise<Employer | undefined> {
    const [employer] = await db.select().from(employers).where(eq(employers.userId, userId));
    return employer || undefined;
  }

  async createEmployer(insertEmployer: InsertEmployer): Promise<Employer> {
    const [employer] = await db
      .insert(employers)
      .values({
        ...insertEmployer,
        verified: false,
      })
      .returning();
    return employer;
  }

  async updateEmployer(id: number, updates: Partial<Employer>): Promise<Employer> {
    const [employer] = await db
      .update(employers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    if (!employer) throw new Error("Employer not found");
    return employer;
  }

  // Job post operations
  async getJobPost(id: number): Promise<JobPost | undefined> {
    const [jobPost] = await db.select().from(jobPosts).where(eq(jobPosts.id, id));
    return jobPost || undefined;
  }

  async createJobPost(insertJobPost: InsertJobPost): Promise<JobPost> {
    const [jobPost] = await db
      .insert(jobPosts)
      .values({
        ...insertJobPost,
        isActive: true,
        applicationsCount: 0,
      })
      .returning();
    return jobPost;
  }

  async updateJobPost(id: number, updates: Partial<JobPost>): Promise<JobPost> {
    const [jobPost] = await db
      .update(jobPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobPosts.id, id))
      .returning();
    if (!jobPost) throw new Error("Job post not found");
    return jobPost;
  }

  async getJobPostsByEmployer(employerId: number): Promise<JobPost[]> {
    return await db.select().from(jobPosts).where(eq(jobPosts.employerId, employerId));
  }

  async getAllJobPosts(): Promise<JobPost[]> {
    return await db.select().from(jobPosts);
  }

  async getEmployerStats(employerId: number): Promise<any> {
    const employerJobs = await db.select().from(jobPosts).where(eq(jobPosts.employerId, employerId));
    const activeJobs = employerJobs.filter(job => job.isActive && !job.fulfilled).length;
    const fulfilledJobs = employerJobs.filter(job => job.fulfilled).length;
    const totalApplications = employerJobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);
    
    return {
      activeJobs,
      fulfilledJobs,
      totalApplications,
      profileViews: Math.floor(Math.random() * 200) + 50,
      successfulHires: Math.floor(Math.random() * 10) + 2,
    };
  }

  async markJobAsFulfilled(jobId: number): Promise<JobPost> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ fulfilled: true, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return updatedJob;
  }

  async activateJob(jobId: number): Promise<JobPost> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return updatedJob;
  }

  async deactivateJob(jobId: number): Promise<JobPost> {
    const [updatedJob] = await db
      .update(jobPosts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(jobPosts.id, jobId))
      .returning();
    return updatedJob;
  }

  async getFulfilledJobsByEmployer(employerId: number): Promise<JobPost[]> {
    return await db
      .select()
      .from(jobPosts)
      .where(and(eq(jobPosts.employerId, employerId), eq(jobPosts.fulfilled, true)))
      .orderBy(desc(jobPosts.updatedAt));
  }

  async getActiveUnfulfilledJobsByEmployer(employerId: number): Promise<JobPost[]> {
    return await db
      .select()
      .from(jobPosts)
      .where(and(
        eq(jobPosts.employerId, employerId),
        eq(jobPosts.isActive, true),
        eq(jobPosts.fulfilled, false)
      ))
      .orderBy(desc(jobPosts.createdAt));
  }

  // Application operations
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db
      .insert(applications)
      .values(insertApplication)
      .returning();
    
    // Update job post application count
    const [jobPost] = await db.select().from(jobPosts).where(eq(jobPosts.id, application.jobPostId));
    if (jobPost) {
      await db
        .update(jobPosts)
        .set({ applicationsCount: (jobPost.applicationsCount || 0) + 1 })
        .where(eq(jobPosts.id, jobPost.id));
    }
    
    return application;
  }

  async getApplicationsByCandidate(candidateId: number): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.candidateId, candidateId));
  }

  async getApplicationsByJob(jobPostId: number): Promise<any[]> {
    const result = await db
      .select({
        id: applications.id,
        jobPostId: applications.jobPostId,
        candidateId: applications.candidateId,
        status: applications.status,
        appliedAt: applications.appliedAt,
        candidateName: users.name,
        candidateEmail: users.email,
        candidatePhone: users.phone,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(users, eq(candidates.userId, users.id))
      .where(eq(applications.jobPostId, jobPostId))
      .orderBy(desc(applications.appliedAt));
    
    return result;
  }

  // Shortlist operations
  async createShortlist(insertShortlist: InsertShortlist): Promise<Shortlist> {
    const [shortlist] = await db
      .insert(shortlists)
      .values(insertShortlist)
      .returning();
    return shortlist;
  }

  async getShortlistsByJob(jobPostId: number): Promise<Shortlist[]> {
    return await db.select().from(shortlists).where(eq(shortlists.jobPostId, jobPostId));
  }

  // Match score operations
  async saveMatchScore(jobPostId: number, candidateId: number, score: number, factors: any): Promise<MatchScore> {
    const [matchScore] = await db
      .insert(matchScores)
      .values({
        jobPostId,
        candidateId,
        score,
        factors,
      })
      .returning();
    return matchScore;
  }

  async getMatchScore(jobPostId: number, candidateId: number): Promise<MatchScore | undefined> {
    const [matchScore] = await db
      .select()
      .from(matchScores)
      .where(and(eq(matchScores.jobPostId, jobPostId), eq(matchScores.candidateId, candidateId)));
    return matchScore || undefined;
  }

  // Admin operations
  async getAdminStats(): Promise<any> {
    const allCandidates = await db.select().from(candidates);
    const activeJobs = await db.select().from(jobPosts).where(eq(jobPosts.isActive, true));
    const allShortlists = await db.select().from(shortlists);
    const matchRate = allCandidates.length > 0 ? Math.floor((allShortlists.length / allCandidates.length) * 100) : 0;
    
    return {
      candidates: allCandidates.length,
      jobs: activeJobs.length,
      matches: allShortlists.length,
      matchRate,
    };
  }

  async getExportData(): Promise<any> {
    const [allCandidates, allEmployers, allJobPosts, allApplications, allShortlists] = await Promise.all([
      db.select().from(candidates),
      db.select().from(employers),
      db.select().from(jobPosts),
      db.select().from(applications),
      db.select().from(shortlists),
    ]);
    
    return {
      candidates: allCandidates,
      employers: allEmployers,
      jobPosts: allJobPosts,
      applications: allApplications,
      shortlists: allShortlists,
    };
  }
}

export const storage = new DatabaseStorage();
