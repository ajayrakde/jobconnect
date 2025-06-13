import { db } from '../db';
import { Candidate, InsertCandidate, Application, candidates, employers, jobPosts, applications, users } from '@shared/schema';
import { eq, ne, desc, and, gte } from 'drizzle-orm';
import type { JobPost } from '@shared/schema';

export class CandidateRepository {
  static async getCandidate(id: number): Promise<Candidate | undefined> {
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(and(eq(candidates.id, id), eq(candidates.deleted, false)));
    return candidate || undefined;
  }

  static async getCandidateByUserId(userId: number): Promise<Candidate | undefined> {
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(and(eq(candidates.userId, userId), eq(candidates.deleted, false)));
    return candidate || undefined;
  }

  static async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const [candidate] = await db
      .insert(candidates)
      .values({
        ...insertCandidate,
        profileStatus: 'pending',
      })
      .returning();
    return candidate;
  }

  static async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate> {
    const [candidate] = await db
      .update(candidates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    if (!candidate) throw new Error('Candidate not found');
    return candidate;
  }

  static async getAllCandidates(): Promise<Candidate[]> {
    return await db
      .select()
      .from(candidates)
      .where(eq(candidates.deleted, false));
  }

  static async getUnverifiedCandidates(): Promise<Candidate[]> {
    return await db
      .select()
      .from(candidates)
      .where(and(eq(candidates.deleted, false), ne(candidates.profileStatus, 'verified')));
  }

  static async verifyCandidate(id: number): Promise<Candidate> {
    const [candidate] = await db
      .update(candidates)
      .set({ profileStatus: 'verified', updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    if (!candidate) throw new Error('Candidate not found');
    return candidate;
  }

  static async softDeleteCandidate(id: number): Promise<Candidate> {
    const [candidate] = await db
      .update(candidates)
      .set({ deleted: true, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    if (!candidate) throw new Error('Candidate not found');
    return candidate;
  }

  static async getCandidateStats(candidateId: number): Promise<any> {
    const candidateApplications: Application[] = await db.select().from(applications).where(eq(applications.candidateId, candidateId));
    const interviews = candidateApplications.filter((app: Application) => app.status === 'interviewed').length;

    return {
      profileViews: Math.floor(Math.random() * 100) + 20,
      applications: candidateApplications.length,
      interviews,
      matchScore: Math.floor(Math.random() * 20) + 80,
    };
  }

  static async getRecommendedJobs(candidateId: number): Promise<any[]> {
    const candidate = await this.getCandidate(candidateId);
    if (!candidate) return [];

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const jobsWithEmployers = await db
      .select({
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
        organizationName: employers.organizationName,
      })
      .from(jobPosts)
      .leftJoin(employers, eq(jobPosts.employerId, employers.id))
      .where(and(gte(jobPosts.createdAt, ninetyDaysAgo), eq(jobPosts.isActive, true), eq(jobPosts.fulfilled, false)));

    const jobsWithEmployersMapped = jobsWithEmployers.map(job => ({
      ...job,
      employer: {
        organizationName: job.organizationName || 'Unknown Organization',
      },
    }));

    const jobsWithScores = jobsWithEmployersMapped.map(job => {
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
        },
      };
    });

    jobsWithScores.sort((a, b) => {
      if (a.compatibilityScore !== b.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    if (jobsWithScores.length === 0) return [];

    const topPercentileCount = Math.max(1, Math.ceil(jobsWithScores.length * 0.1));
    return jobsWithScores.slice(0, topPercentileCount);
  }

  private static calculateJobCompatibility(job: any, candidate: any): { score: number; factors: any } {
    const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
    const candidateExperience = Array.isArray(candidate.experience) ? candidate.experience : [];
    const candidateQualifications = Array.isArray(candidate.qualifications) ? candidate.qualifications : [];

    const jobSkills = job.skills ? job.skills.toLowerCase().split(',').map((s: string) => s.trim()) : [];
    const matchingSkills = candidateSkills.filter((skill: string) =>
      jobSkills.some((jobSkill: string) => jobSkill.includes(skill.toLowerCase()))
    );
    const skillsScore = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 100 : 50;

    const totalExperience = candidateExperience.reduce((total: number, exp: any) => {
      const duration = parseInt(exp.duration?.toString() || '0');
      return total + (isNaN(duration) ? 0 : duration);
    }, 0);

    const requiredExperience = parseInt(job.experienceRequired?.match(/\d+/)?.[0] || '0');
    const experienceScore = requiredExperience > 0
      ? Math.min((totalExperience / requiredExperience) * 100, 100)
      : totalExperience > 0 ? 100 : 50;

    const expectedSalary = candidate.expectedSalary || 0;
    const salaryRange = job.salaryRange || '';
    const salaryNumbers = salaryRange.match(/\d+/g);
    const maxSalary = salaryNumbers ? parseInt(salaryNumbers[salaryNumbers.length - 1]) : 0;
    const salaryScore = expectedSalary > 0 && maxSalary > 0
      ? Math.max(0, 100 - Math.abs(expectedSalary - maxSalary) / maxSalary * 100)
      : 50;

    const candidateLocation = candidate.address?.toLowerCase() || '';
    const jobLocation = job.location?.toLowerCase() || '';
    const locationScore = candidateLocation && jobLocation
      ? (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation) ? 100 : 30)
      : 50;

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
        qualificationScore,
      },
    };
  }

  static async getCandidateApplications(candidateId: number): Promise<any[]> {
    const candidateApplications: Application[] = await db.select().from(applications).where(eq(applications.candidateId, candidateId));
    const applicationsWithJobs = [] as any[];

    for (const app of candidateApplications) {
      const [job] = await db.select().from(jobPosts).where(eq(jobPosts.id, app.jobPostId));
      applicationsWithJobs.push({
        ...app,
        jobTitle: job?.title || 'Unknown Job',
        company: 'Sample Company',
        appliedDate: app.appliedAt?.toDateString() || 'Recently',
      });
    }
    return applicationsWithJobs;
  }
}

