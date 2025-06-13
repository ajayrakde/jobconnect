// Re-export all schema definitions
export * from './schema/users';
export * from './schema/candidates';
export * from './schema/employers';
export * from './schema/applications';
export * from './schema/admin';

// Export commonly used types
export type {
  NewUser,
  User,
  NewCandidate,
  Candidate,
  NewEmployer,
  Employer,
  NewApplication,
  Application,
} from './types';
