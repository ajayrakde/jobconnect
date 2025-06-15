export const genders = ["male", "female", "other"] as const;
export type Gender = typeof genders[number];
