import { Router } from 'express';
import { storage } from '../storage';
import { insertUserSchema, type InsertUser } from '@shared/schema';
import { authenticateUser } from '../middleware/authenticate';
import { asyncHandler } from '../utils/asyncHandler';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(async (req, res) => {
  const userData: InsertUser = insertUserSchema.parse(req.body);
  const existingUserByUid = await storage.getUserByFirebaseUid(userData.firebaseUid);
  if (existingUserByUid) {
    return res.json(existingUserByUid);
  }
  const existingUserByEmail = await storage.getUserByEmail(userData.email);
  if (existingUserByEmail) {
    return res.status(409).json({ message: 'Email already registered', code: 'EMAIL_EXISTS' });
  }
  const user = await storage.createUser(userData);
  res.json(user);
}));

authRouter.get('/profile', authenticateUser, asyncHandler(async (req: any, res) => {
  const user = await storage.getUserByFirebaseUid(req.user.uid);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  let profileData: any = { ...user };
  if (user.role === 'candidate') {
    const candidate = await storage.getCandidateByUserId(user.id);
    profileData.candidate = candidate;
  } else if (user.role === 'employer') {
    const employer = await storage.getEmployerByUserId(user.id);
    profileData.employer = employer;
  }
  res.json(profileData);
}));
