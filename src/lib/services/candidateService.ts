import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  deleteDoc,
  type Firestore
} from "firebase/firestore";
import { db } from "../firebase";
import type { CandidateProfile } from "../types";
import { getCandidateByCode } from "./electionService";
import { uniqueCandidateCode } from "../utils";
import type { CandidateProfileInput } from "../schemas";

export async function saveCandidateProfile(
  uid: string,
  input: CandidateProfileInput,
  photo: { url: string; publicId: string } | null,
  email: string,
  firestore: Firestore = db
): Promise<string> {
  const ref = doc(firestore, "candidateProfiles", uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as CandidateProfile) : null;

  let code = existing?.candidateCode;
  if (!code) {
    code = await uniqueCandidateCode(async (c) => (await getCandidateByCode(c, firestore)) !== null);
  }

  const updated: Partial<CandidateProfile> = {
    uid,
    email,
    name: input.name,
    gender: input.gender,
    promises: input.promises,
    candidateCode: code,
    profileCompleted: true,
    updatedAt: Date.now()
  };
  if (photo) {
    updated.photoUrl = photo.url;
    updated.cloudinaryPublicId = photo.publicId;
  } else if (existing?.photoUrl) {
    updated.photoUrl = existing.photoUrl;
    updated.cloudinaryPublicId = existing.cloudinaryPublicId;
  }

  await setDoc(ref, updated, { merge: true });
  return code;
}
