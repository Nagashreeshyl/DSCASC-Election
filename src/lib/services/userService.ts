import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type Firestore
} from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { db } from "../firebase";
import { ADMIN_EMAILS } from "../config";
import type { UserDoc, UserRole, CandidateProfile } from "../types";

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Resolves and (if needed) creates the user's record and role on first login.
 * Role precedence: Admin (by email) > Teacher (by teacherProfiles) > Candidate (by candidateEmails) > Student.
 * The database security rules independently enforce that only the correct emails may claim admin/teacher/candidate.
 */
export async function ensureUserRecord(auth: Auth, firestore: Firestore = db): Promise<UserDoc> {
  const u = auth.currentUser;
  if (!u) throw new Error("Not authenticated");

  const email = emailKey(u.email || "");
  const displayName = u.displayName || email.split("@")[0];
  const photoURL = u.photoURL || "";

  return runTransaction(firestore, async (tx) => {
    const userRef = doc(firestore, "users", u.uid);
    const userSnap = await tx.get(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserDoc;
    }

    const teacherRef = doc(firestore, "teacherProfiles", email);
    const candidateEmailRef = doc(firestore, "candidateEmails", email);

    const teacherSnap = await tx.get(teacherRef);
    const candidateEmailSnap = await tx.get(candidateEmailRef);

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
    tx.set(userRef, userDoc);

    if (role === "teacher") {
      tx.update(teacherRef, { uid: u.uid, displayName, photoURL, updatedAt: now });
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
      tx.set(doc(firestore, "candidateProfiles", u.uid), candidateProfile);
      tx.update(candidateEmailRef, { uid: u.uid });
    }

    return userDoc;
  });
}

export async function getUserDoc(uid: string, firestore: Firestore = db): Promise<UserDoc | null> {
  const snap = await getDoc(doc(firestore, "users", uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function getCandidateProfile(uid: string, firestore: Firestore = db) {
  const snap = await getDoc(doc(firestore, "candidateProfiles", uid));
  return snap.exists() ? (snap.data() as CandidateProfile) : null;
}
