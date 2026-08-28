import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  type Firestore
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  ElectionDoc,
  ElectionCandidate,
  VoteDoc,
  CandidateScore,
  GenderResult,
  ElectionResult,
  Gender
} from "../types";

async function readVotes(electionId: string, firestore: Firestore = db): Promise<VoteDoc[]> {
  const snap = await getDocs(collection(firestore, "elections", electionId, "votes"));
  return snap.docs.map((d) => d.data() as VoteDoc);
}

function buildGenderResult(
  gender: Gender,
  candidates: ElectionCandidate[],
  votes: VoteDoc[],
  studentWeight: number,
  authorityWeightEach: number
): GenderResult {
  const group = candidates.filter((c) => c.gender === gender);
  const studentKinds = new Set(["student", "candidate"]);

  let totalValidVotes = 0;
  for (const v of votes) {
    if (gender === "Male" && v.maleCandidateId) totalValidVotes++;
    if (gender === "Female" && v.femaleCandidateId) totalValidVotes++;
  }

  const scores: CandidateScore[] = group.map((c) => {
    let studentVotes = 0;
    let hodScore = 0;
    let coordinatorScore = 0;
    let counsellorScore = 0;

    for (const v of votes) {
      const selected =
        gender === "Male"
          ? v.maleCandidateId === c.uid
          : v.femaleCandidateId === c.uid;
      if (!selected) continue;
      if (studentKinds.has(v.voterKind)) studentVotes++;
      else if (v.voterKind === "hod") hodScore = authorityWeightEach;
      else if (v.voterKind === "coordinator") coordinatorScore = authorityWeightEach;
      else if (v.voterKind === "counsellor") counsellorScore = authorityWeightEach;
    }

    const studentVoteShare = totalValidVotes > 0 ? studentVotes / totalValidVotes : 0;
    const studentWeightedScore = studentVoteShare * studentWeight;
    const totalScore = studentWeightedScore + hodScore + coordinatorScore + counsellorScore;

    return {
      uid: c.uid,
      candidateCode: c.candidateCode,
      name: c.name,
      gender,
      photoUrl: c.photoUrl,
      promises: c.promises,
      studentVotes,
      studentVoteShare,
      studentWeightedScore: round2(studentWeightedScore),
      hodScore,
      coordinatorScore,
      counsellorScore,
      totalScore: round2(totalScore),
      rank: 0,
      isWinner: false,
      tie: false
    };
  });

  const sorted = [...scores].sort(
    (a, b) => b.totalScore - a.totalScore || b.studentVotes - a.studentVotes || a.name.localeCompare(b.name)
  );
  sorted.forEach((s, i) => (s.rank = i + 1));

  const winners: string[] = [];
  let hasTie = false;
  if (sorted.length >= 1) winners.push(sorted[0].uid);
  if (sorted.length >= 2) {
    winners.push(sorted[1].uid);
    const secondScore = sorted[1].totalScore;
    const tiedAtSecond = sorted.filter((s) => s.totalScore === secondScore).length;
    if (tiedAtSecond > 1) hasTie = true;
    if (sorted[0].totalScore === sorted[1].totalScore) hasTie = true;
  }
  for (const s of sorted) s.isWinner = winners.includes(s.uid);
  for (const s of sorted) if (s.isWinner && hasTie) s.tie = true;

  return {
    gender,
    totalValidVotes,
    candidates: sorted,
    winners,
    hasTie
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function calculateResults(
  election: ElectionDoc,
  candidates: ElectionCandidate[],
  firestore: Firestore = db
): Promise<ElectionResult> {
  const votes = await readVotes(election.id, firestore);
  const male = buildGenderResult("Male", candidates, votes, election.studentWeight, election.authorityWeightEach);
  const female = buildGenderResult("Female", candidates, votes, election.studentWeight, election.authorityWeightEach);
  return {
    electionId: election.id,
    male,
    female,
    calculatedAt: Date.now(),
    finalized: election.finalized,
    finalizedBy: election.finalized ? undefined : undefined,
    finalizedAt: election.finalized ? election.updatedAt : undefined
  };
}

export async function storeResult(
  electionId: string,
  result: ElectionResult,
  finalized: boolean,
  finalizedBy?: string,
  firestore: Firestore = db
): Promise<void> {
  const payload: ElectionResult = {
    ...result,
    finalized,
    finalizedBy,
    finalizedAt: finalized ? Date.now() : undefined
  };
  await setDoc(doc(firestore, "elections", electionId, "result", "latest"), payload, { merge: true });
  if (finalized) {
    await setDoc(doc(firestore, "elections", electionId), { finalized: true, status: "RESULTS_PUBLISHED", updatedAt: Date.now() }, { merge: true });
  }
}

export async function getStoredResult(
  electionId: string,
  firestore: Firestore = db
): Promise<ElectionResult | null> {
  const snap = await getDoc(doc(firestore, "elections", electionId, "result", "latest"));
  return snap.exists() ? (snap.data() as ElectionResult) : null;
}
