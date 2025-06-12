import {
  User,
  Candidate,
  Employer,
  JobPost,
  Application,
  Shortlist,
  MatchScore,
  AdminInviteCode,
} from "@shared/schema";

const now = new Date();

export const demoUsers: User[] = [
  {
    id: 1,
    firebaseUid: "demo-candidate-uid",
    email: "candidate@example.com",
    phone: "555-0001",
    role: "candidate",
    name: "Alice Candidate",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    firebaseUid: "demo-employer-uid",
    email: "employer@example.com",
    phone: "555-0002",
    role: "employer",
    name: "Acme HR",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    firebaseUid: "demo-admin-uid",
    email: "admin@example.com",
    phone: "555-0003",
    role: "admin",
    name: "System Admin",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    firebaseUid: "demo-candidate2-uid",
    email: "jane@example.com",
    phone: "555-0004",
    role: "candidate",
    name: "Jane Doe",
    createdAt: now,
    updatedAt: now,
  },
];

export const demoCandidates: Candidate[] = [
  {
    id: 1,
    userId: 1,
    skills: ["typescript", "react"],
    languages: ["English"],
    profileStatus: "verified",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    userId: 4,
    dateOfBirth: "1990-01-01",
    gender: "female",
    maritalStatus: "single",
    dependents: 0,
    address: "456 Side St",
    emergencyContact: "555-1111",
    qualifications: [{ degree: "Bachelor", field: "Computer Science" }],
    experience: [{ company: "Acme", years: 2 }],
    skills: ["typescript", "react"],
    languages: ["English"],
    expectedSalary: 800000,
    jobCodes: ["DEV001"],
    documents: [],
    profileStatus: "verified",
    deleted: false,
    createdAt: now,
    updatedAt: now,
  },
];

export const demoEmployers: Employer[] = [
  {
    id: 1,
    userId: 2,
    organizationName: "Acme Inc",
    registrationNumber: "REG123",
    businessType: "Software",
    address: "123 Main St",
    contactEmail: "employer@example.com",
    contactPhone: "555-0002",
    profileStatus: "verified",
    createdAt: now,
    updatedAt: now,
  },
];

export const demoJobPosts: JobPost[] = [
  {
    id: 1,
    employerId: 1,
    jobCode: "DEV001",
    title: "Full Stack Developer",
    description: "Work on our web platform",
    minQualification: "Bachelors",
    experienceRequired: "2 years",
    skills: "typescript,react,node",
    responsibilities: "Develop and maintain apps",
    salaryRange: "\u20B96-10 LPA",
    location: "Remote",
    vacancy: 1,
    isActive: true,
    fulfilled: false,
    deleted: false,
    applicationsCount: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    employerId: 1,
    jobCode: "DEV002",
    title: "Frontend Developer",
    description: "Build UI components",
    minQualification: "Diploma",
    experienceRequired: "1 year",
    skills: "javascript,react,css",
    responsibilities: "Create and maintain web UIs",
    salaryRange: "\u20B95-7 LPA",
    location: "Remote",
    vacancy: 2,
    isActive: true,
    fulfilled: false,
    deleted: false,
    applicationsCount: 0,
    createdAt: now,
    updatedAt: now,
  },
];

export const demoApplications: Application[] = [
  {
    id: 1,
    candidateId: 1,
    jobPostId: 1,
    status: "applied",
    appliedAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    candidateId: 2,
    jobPostId: 2,
    status: "applied",
    appliedAt: now,
    updatedAt: now,
  },
];

export const demoShortlists: Shortlist[] = [
  {
    id: 1,
    jobPostId: 1,
    candidateId: 1,
    matchScore: 85,
    shortlistedBy: 3,
    shortlistedAt: now,
  },
];

export const demoMatchScores: MatchScore[] = [
  {
    id: 1,
    jobPostId: 1,
    candidateId: 1,
    score: 90,
    factors: { skills: 90, experience: 80 },
    calculatedAt: now,
  },
];

export const demoAdminInviteCodes: AdminInviteCode[] = [
  {
    id: 1,
    code: "INVITE123",
    used: false,
    createdAt: now,
  },
];
