import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  type Firestore
} from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { db } from "../firebase";
import { ADMIN_EMAILS } from "../config";
import type { UserDoc, UserRole, CandidateProfile } from "../types";

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureUserRecord(auth: Auth, firestore: Firestore = db): Promise<UserDoc> {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");

  const email = emailKey(u.email || "");
  const displayName = u.displayName || email.split("@")[0];
  const photoURL = u.photoURL || "";

  const teacherRef = doc(firestore, "teacherProfiles", email);
  const candidateEmailRef = doc(firestore, "candidateEmails", email);

  const teacherSnap = await getDoc(teacherRef);
  const candidateEmailSnap = await getDoc(candidateEmailRef);

  let role: UserRole = "student";
  if (ADMIN_EMAILS.includes(email)) role = "admin";
  else if (teacherSnap.exists()) role = "teacher";
  else if (candidateEmailSnap.exists()) role = "candidate";

  const now = Date.now();
  const userDoc: UserDoc = {
    uid: u.uid,
    email,
    displayName,
    photoURL,
    role,
    createdAt: now,
    updatedAt: now
  };

  const userRef = doc(firestore, "users", u.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, userDoc);
  }

  if (role === "teacher") {
    await setDoc(teacherRef, { uid: u.uid, displayName, photoURL, updatedAt: now }, { merge: true });
  }

  if (role === "candidate") {
    const candidateProfile: CandidateProfile = {
      uid: u.uid,
      email,
      name: displayName,
      gender: "Male",
      photoUrl: photoURL,
      cloudinaryPublicId: "",
      promises: [],
      candidateCode: "",
      profileCompleted: false,
      enrolledElectionIds: [],
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(firestore, "candidateProfiles", u.uid), candidateProfile);
    await updateDoc(candidateEmailRef, { uid: u.uid });
  }

  return userDoc;
}

export async function getUserDoc(uid: string, firestore: Firestore = db): Promise<UserDoc | null> {
  const snap = await getDoc(doc(firestore, "users", uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function getCandidateProfile(uid: string, firestore: Firestore = db) {
  const snap = await getDoc(doc(firestore, "candidateProfiles", uid));
  return snap.exists() ? (snap.data() as CandidateProfile) : null;
}
