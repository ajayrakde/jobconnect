// @ts-nocheck
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "lokaljobs-d45a0.firebaseapp.com",
  projectId: "lokaljobs-d45a0",
  storageBucket: "lokaljobs-d45a0.firebasestorage.app",
  messagingSenderId: "930575883575",
  appId: "1:930575883575:web:29e6ab529b7d8a20604eb2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

export default app;
