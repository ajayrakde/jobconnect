import { config } from 'dotenv';
config();
import admin from 'firebase-admin';

let firebaseApp: admin.app.App | undefined;

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const rawKey = process.env.FIREBASE_PRIVATE_KEY;
const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

if (projectId && (rawKey || b64Key) && clientEmail) {
  // Initialize Firebase Admin SDK when credentials are available
  const privateKey = b64Key
    ? Buffer.from(b64Key, 'base64').toString('utf8')
    : rawKey!.replace(/\\n/g, '\n');

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey,
      clientEmail,
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
