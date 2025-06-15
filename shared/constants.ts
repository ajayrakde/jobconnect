// Consistent labels used across admin filters and employer forms
export const experienceLevels = [
  "Entry Level (0-1 years)",
  "Junior (1-3 years)",
  "Mid-Level (3-5 years)",
  "Senior (5-8 years)",
  "Lead (8+ years)",
  "Executive (10+ years)"
] as const;

export type ExperienceLevel = typeof experienceLevels[number];
