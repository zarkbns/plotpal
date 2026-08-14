import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth configured for Google login
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Minimal Firestore instance for user profile & manuscript index (IDs/titles ONLY)
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || "(default)"
);

export default app;
