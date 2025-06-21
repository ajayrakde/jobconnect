import { config } from 'dotenv';
config();
import admin from 'firebase-admin';

let firebaseApp: admin.app.App | undefined;
if (
  process.env.VITE_FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
) {
  // Initialize Firebase Admin SDK when credentials are available
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
} else {
  console.warn(
    'Firebase Admin credentials are missing. Admin features are disabled.'
  );
}

export const auth = firebaseApp ? admin.auth() : undefined;
export const firestore = firebaseApp ? admin.firestore() : undefined;
export const storage = firebaseApp ? admin.storage() : undefined;

export async function verifyFirebaseToken(token: string) {
  if (!auth) {
    throw new Error('Firebase Admin not configured');
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid Firebase token');
  }
}

export async function createCustomToken(uid: string, additionalClaims?: any) {
  if (!auth) {
    throw new Error('Firebase Admin not configured');
  }
  try {
    return await auth.createCustomToken(uid, additionalClaims);
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new Error('Failed to create custom token');
  }
}

export async function setUserClaims(uid: string, claims: any) {
  if (!auth) {
    throw new Error('Firebase Admin not configured');
  }
  try {
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Error setting user claims:', error);
    throw new Error('Failed to set user claims');
  }
}
