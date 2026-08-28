import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  ElectionDoc,
  ElectionCandidate,
  AuthorityAssignments,
  EligibleStudent,
  CandidateProfile
} from "../types";
import type { ElectionFormInput } from "../schemas";
import { combineDateTime } from "../schemas";

export async function createElection(
  input: ElectionFormInput,
  createdBy: string,
  firestore: Firestore = db
): Promise<string> {
  const now = Date.now();
  const data: Omit<ElectionDoc, "id"> = {
    name: input.name,
    description: input.description || "",
    className: input.className,
    section: input.section,
    createdBy,
    startTime: combineDateTime(input.startDate, input.startTime),
    endTime: combineDateTime(input.endDate, input.endTime),
    resultTime: combineDateTime(input.resultDate, input.resultTime),
    eligibilityMode: input.eligibilityMode,
    status: "UPCOMING",
    authority: {
      hodEmail: "",
      hodUid: null,
      coordinatorEmail: "",
      coordinatorUid: null,
      counsellorEmail: "",
      counsellorUid: null
    },
    studentWeight: input.studentWeight,
    authorityWeightEach: input.authorityWeightEach,
    createdAt: now,
    updatedAt: now,
    finalized: false
  };
  const ref = await addDoc(collection(firestore, "elections"), data);
  return ref.id;
}

export async function updateElectionTimes(
  id: string,
  input: ElectionFormInput,
  firestore: Firestore = db
) {
  await updateDoc(doc(firestore, "elections", id), {
    name: input.name,
    description: input.description || "",
    className: input.className,
    section: input.section,
    startTime: combineDateTime(input.startDate, input.startTime),
    endTime: combineDateTime(input.endDate, input.endTime),
    resultTime: combineDateTime(input.resultDate, input.resultTime),
    eligibilityMode: input.eligibilityMode,
    studentWeight: input.studentWeight,
    authorityWeightEach: input.authorityWeightEach,
    updatedAt: Date.now()
  });
}

export async function getElection(id: string, firestore: Firestore = db): Promise<ElectionDoc | null> {
  const snap = await getDoc(doc(firestore, "elections", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ElectionDoc;
}

export async function listElections(firestore: Firestore = db): Promise<ElectionDoc[]> {
  const q = query(collection(firestore, "elections"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ElectionDoc);
}

export async function setAuthority(
  electionId: string,
  input: { hodEmail: string; coordinatorEmail: string; counsellorEmail: string },
  firestore: Firestore = db
) {
  const resolve = async (email: string): Promise<string | null> => {
    if (!email) return null;
    const q = query(collection(firestore, "users"), where("email", "==", email.trim().toLowerCase()));
    const snap = await getDocs(q);
    return snap.empty ? null : (snap.docs[0].data() as { uid: string }).uid;
  };
  const authority: AuthorityAssignments = {
    hodEmail: input.hodEmail.trim().toLowerCase(),
    hodUid: await resolve(input.hodEmail),
    coordinatorEmail: input.coordinatorEmail.trim().toLowerCase(),
    coordinatorUid: await resolve(input.coordinatorEmail),
    counsellorEmail: input.counsellorEmail.trim().toLowerCase(),
    counsellorUid: await resolve(input.counsellorEmail)
  };
  await updateDoc(doc(firestore, "elections", electionId), { authority, updatedAt: Date.now() });
  return authority;
}

export async function getCandidateByCode(
  code: string,
  firestore: Firestore = db
): Promise<CandidateProfile | null> {
  const q = query(
    collection(firestore, "candidateProfiles"),
    where("candidateCode", "==", code.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as CandidateProfile;
}

export async function enrollCandidate(
  electionId: string,
  profile: CandidateProfile,
  firestore: Firestore = db
) {
  const enrollment: ElectionCandidate = {
    uid: profile.uid,
    candidateCode: profile.candidateCode,
    name: profile.name,
    gender: profile.gender,
    photoUrl: profile.photoUrl,
    promises: profile.promises,
    enrolledAt: Date.now()
  };
  await setDoc(doc(firestore, "elections", electionId, "candidates", profile.uid), enrollment);
  const candRef = doc(firestore, "candidateProfiles", profile.uid);
  const candSnap = await getDoc(candRef);
  const existing = candSnap.exists() ? (candSnap.data() as CandidateProfile) : null;
  const enrolled = new Set(existing?.enrolledElectionIds || []);
  enrolled.add(electionId);
  await updateDoc(candRef, { enrolledElectionIds: Array.from(enrolled), updatedAt: Date.now() });
}

export async function removeCandidate(
  electionId: string,
  candidateUid: string,
  firestore: Firestore = db
) {
  await deleteDoc(doc(firestore, "elections", electionId, "candidates", candidateUid));
  const candRef = doc(firestore, "candidateProfiles", candidateUid);
  const candSnap = await getDoc(candRef);
  if (candSnap.exists()) {
    const data = candSnap.data() as CandidateProfile;
    const enrolled = (data.enrolledElectionIds || []).filter((e) => e !== electionId);
    await updateDoc(candRef, { enrolledElectionIds: enrolled, updatedAt: Date.now() });
  }
}

export async function getElectionCandidates(
  electionId: string,
  firestore: Firestore = db
): Promise<ElectionCandidate[]> {
  const q = query(
    collection(firestore, "elections", electionId, "candidates"),
    orderBy("enrolledAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ElectionCandidate);
}

export async function addEligibleStudent(
  electionId: string,
  email: string,
  addedBy: string,
  firestore: Firestore = db
) {
  const key = email.trim().toLowerCase();
  await setDoc(doc(firestore, "elections", electionId, "eligibleStudents", key), {
    email: key,
    addedAt: Date.now(),
    addedBy
  } as EligibleStudent);
}

export async function removeEligibleStudent(
  electionId: string,
  email: string,
  firestore: Firestore = db
) {
  await deleteDoc(doc(firestore, "elections", electionId, "eligibleStudents", email.trim().toLowerCase()));
}

export async function listEligibleStudents(
  electionId: string,
  firestore: Firestore = db
): Promise<EligibleStudent[]> {
  const snap = await getDocs(collection(firestore, "elections", electionId, "eligibleStudents"));
  return snap.docs.map((d) => d.data() as EligibleStudent);
}

// Students may only read their own eligible-student row (vote secrecy / minimal disclosure).
export async function getEligibleStudentDoc(
  electionId: string,
  email: string,
  firestore: Firestore = db
): Promise<EligibleStudent | null> {
  const snap = await getDoc(doc(firestore, "elections", electionId, "eligibleStudents", email.trim().toLowerCase()));
  return snap.exists() ? (snap.data() as EligibleStudent) : null;
}

export async function addCandidateEmail(
  email: string,
  addedBy: string,
  firestore: Firestore = db
): Promise<void> {
  const key = email.trim().toLowerCase();
  await setDoc(doc(firestore, "candidateEmails", key), {
    email: key,
    uid: "",
    addedAt: Date.now(),
    addedBy
  });
}

export async function listCandidateEmails(
  firestore: Firestore = db
): Promise<string[]> {
  const snap = await getDocs(collection(firestore, "candidateEmails"));
  return snap.docs.map((d) => (d.data() as { email: string }).email);
}

export function isStudentEligible(
  election: ElectionDoc,
  email: string,
  eligibleSet: Set<string>
): boolean {
  if (election.eligibilityMode === "open") return true;
  return eligibleSet.has(email.trim().toLowerCase());
}

export async function getElectionsByIds(
  ids: string[],
  firestore: Firestore = db
): Promise<{ id: string; name: string }[]> {
  const out: { id: string; name: string }[] = [];
  for (const id of ids) {
    const e = await getElection(id, firestore);
    if (e) out.push({ id: e.id, name: e.name });
  }
  return out;
}
