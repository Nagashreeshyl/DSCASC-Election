import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  deleteDoc,
  updateDoc,
  type Firestore
} from "firebase/firestore";
import { db } from "../firebase";
import type { UserDoc, TeacherProfile, CandidateProfile } from "../types";

export async function addTeacher(email: string, firestore: Firestore = db): Promise<void> {
  const key = email.trim().toLowerCase();
  const profile: TeacherProfile = {
    uid: "",
    email: key,
    displayName: key.split("@")[0],
    photoURL: "",
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  await setDoc(doc(firestore, "teacherProfiles", key), profile);
}

export async function removeTeacher(email: string, firestore: Firestore = db): Promise<void> {
  await deleteDoc(doc(firestore, "teacherProfiles", email.trim().toLowerCase()));
}

export async function setTeacherActive(email: string, active: boolean, firestore: Firestore = db): Promise<void> {
  await updateDoc(doc(firestore, "teacherProfiles", email.trim().toLowerCase()), { active, updatedAt: Date.now() });
}

export async function listTeachers(firestore: Firestore = db): Promise<TeacherProfile[]> {
  const snap = await getDocs(query(collection(firestore, "teacherProfiles"), orderBy("email", "asc")));
  return snap.docs.map((d) => d.data() as TeacherProfile);
}

export async function listUsers(firestore: Firestore = db): Promise<UserDoc[]> {
  const snap = await getDocs(query(collection(firestore, "users"), orderBy("role", "asc")));
  return snap.docs.map((d) => d.data() as UserDoc);
}

export async function listCandidates(firestore: Firestore = db): Promise<CandidateProfile[]> {
  const snap = await getDocs(query(collection(firestore, "candidateProfiles"), orderBy("name", "asc")));
  return snap.docs.map((d) => d.data() as CandidateProfile);
}

export interface AdminStats {
  totalUsers: number;
  totalTeachers: number;
  totalCandidates: number;
  totalElections: number;
  activeElections: number;
}

export async function getAdminStats(firestore: Firestore = db): Promise<AdminStats> {
  const [users, teachers, candidates, elections] = await Promise.all([
    getDocs(collection(firestore, "users")),
    getDocs(collection(firestore, "teacherProfiles")),
    getDocs(collection(firestore, "candidateProfiles")),
    getDocs(collection(firestore, "elections"))
  ]);
  const now = Date.now();
  const active = elections.docs.filter((d) => {
    const e = d.data() as { startTime: number; endTime: number };
    return now >= e.startTime && now < e.endTime;
  }).length;
  return {
    totalUsers: users.size,
    totalTeachers: teachers.size,
    totalCandidates: candidates.size,
    totalElections: elections.size,
    activeElections: active
  };
}
