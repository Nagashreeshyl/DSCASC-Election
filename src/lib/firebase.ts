import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInWithEmailAndPassword, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore, doc, setDoc, getDoc, runTransaction } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== "undefined" || process.env.NODE_ENV === "test") {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true" && typeof window !== "undefined") {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    (window as any).__auth = auth;
    (window as any).__db = db;
    (window as any).__signInWithCustomToken = (t: string) => signInWithCustomToken(auth, t);
    (window as any).__signInWithPassword = (email: string, pw: string) => signInWithEmailAndPassword(auth, email, pw);
    (window as any).__fs = { db, doc, setDoc, getDoc, runTransaction };
  }
}

export { app, auth, db };
export const isFirebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
