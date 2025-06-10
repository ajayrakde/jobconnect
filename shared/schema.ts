import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").notNull(), // 'candidate', 'employer', 'admin'
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dateOfBirth: text("date_of_birth"), // Store as string in YYYY-MM-DD format
  gender: text("gender"),
  maritalStatus: text("marital_status"),
  dependents: integer("dependents").default(0),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  qualifications: jsonb("qualifications"), // Array of qualification objects
  experience: jsonb("experience"), // Array of experience objects
  skills: jsonb("skills"), // Array of skills
  languages: jsonb("languages"), // Array of languages
  expectedSalary: integer("expected_salary"),
  jobCodes: jsonb("job_codes"), // Array of job codes applying for
  documents: jsonb("documents"), // Firebase Storage URLs
  profileStatus: text("profile_status").default('pending').notNull(),
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employers = pgTable("employers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  organizationName: text("organization_name").notNull(),
  registrationNumber: text("registration_number").notNull(),
  businessType: text("business_type").notNull(),
  address: text("address").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  documents: jsonb("documents"), // Firebase Storage URLs
  profileStatus: text("profile_status").default('pending').notNull(),
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobPosts = pgTable("job_posts", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").references(() => employers.id).notNull(),
  jobCode: text("job_code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  minQualification: text("min_qualification").notNull(),
  experienceRequired: text("experience_required"),
  skills: text("skills").notNull(), // Comma-separated skills
  responsibilities: text("responsibilities").notNull(), // Job responsibilities
  salaryRange: text("salary_range").notNull(),
  location: text("location").notNull(),
  vacancy: integer("vacancy").default(1), // Number of positions
  isActive: boolean("is_active").default(true),
  fulfilled: boolean("fulfilled").default(false),
  deleted: boolean("deleted").default(false),
  applicationsCount: integer("applications_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  jobPostId: integer("job_post_id").references(() => jobPosts.id).notNull(),
  status: text("status").default("applied"), // 'applied', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'hired'
  appliedAt: timestamp("applied_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shortlists = pgTable("shortlists", {
  id: serial("id").primaryKey(),
  jobPostId: integer("job_post_id").references(() => jobPosts.id).notNull(),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  matchScore: integer("match_score"), // 0-100 compatibility score
  shortlistedBy: integer("shortlisted_by").references(() => users.id).notNull(),
  shortlistedAt: timestamp("shortlisted_at").defaultNow(),
});

export const matchScores = pgTable("match_scores", {
  id: serial("id").primaryKey(),
  jobPostId: integer("job_post_id").references(() => jobPosts.id).notNull(),
  candidateId: integer("candidate_id").references(() => candidates.id).notNull(),
  score: integer("score").notNull(), // 0-100 compatibility score
  factors: jsonb("factors"), // Object containing score breakdown
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  firebaseUid: true,
  email: true,
  phone: true,
  role: true,
  name: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  profileStatus: true,
  deleted: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployerSchema = createInsertSchema(employers).omit({
  id: true,
  profileStatus: true,
  deleted: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobPostSchema = createInsertSchema(jobPosts).omit({
  id: true,
  applicationsCount: true,
  deleted: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertShortlistSchema = createInsertSchema(shortlists).omit({
  id: true,
  shortlistedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Employer = typeof employers.$inferSelect;
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type JobPost = typeof jobPosts.$inferSelect;
export type InsertJobPost = z.infer<typeof insertJobPostSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Shortlist = typeof shortlists.$inferSelect;
export type InsertShortlist = z.infer<typeof insertShortlistSchema>;
export type MatchScore = typeof matchScores.$inferSelect;
