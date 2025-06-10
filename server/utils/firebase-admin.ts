import { config } from 'dotenv';
config();
import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();

export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    throw new Error("Invalid Firebase token");
  }
}

export async function createCustomToken(uid: string, additionalClaims?: any) {
  try {
    return await auth.createCustomToken(uid, additionalClaims);
  } catch (error) {
    console.error("Error creating custom token:", error);
    throw new Error("Failed to create custom token");
  }
}

export async function setUserClaims(uid: string, claims: any) {
  try {
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error("Error setting user claims:", error);
    throw new Error("Failed to set user claims");
  }
}
