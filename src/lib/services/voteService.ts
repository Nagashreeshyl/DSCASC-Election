import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  type Firestore
} from "firebase/firestore";
import { db } from "../firebase";
import type { ElectionDoc, VoteDoc, VoterKind, Gender, UserDoc } from "../types";

export interface VoterContext {
  kind: VoterKind;
  voterGender?: Gender; // present for candidate voters
  canVoteMale: boolean;
  canVoteFemale: boolean;
  isAuthority: boolean;
  authorityWeight: number; // percent contributed by this voter (0 for students)
}

/**
 * Determines how the current user may vote in a given election.
 * Precedence: enrolled candidate (opposite-gender only) > per-election authority > student.
 */
export function getVoterContext(
  user: UserDoc,
  election: ElectionDoc,
  candidateGender?: Gender
): VoterContext {
  const email = user.email.trim().toLowerCase();
  const auth = election.authority;
  const authorityMatch =
    auth.hodEmail === email ? "hod" : auth.coordinatorEmail === email ? "coordinator" : auth.counsellorEmail === email ? "counsellor" : null;

  // Authority (per-election), available to any base role that was assigned.
  // Matched by email (stable) rather than uid, since the assignee may not have logged in yet.
  if (authorityMatch) {
    return {
      kind: authorityMatch,
      canVoteMale: true,
      canVoteFemale: true,
      isAuthority: true,
      authorityWeight: election.authorityWeightEach
    };
  }

  if (user.role === "candidate" && candidateGender) {
    return {
      kind: "candidate",
      voterGender: candidateGender,
      canVoteMale: candidateGender === "Female", // female candidate votes male
      canVoteFemale: candidateGender === "Male", // male candidate votes female
      isAuthority: false,
      authorityWeight: 0
    };
  }

  return {
    kind: "student",
    canVoteMale: true,
    canVoteFemale: true,
    isAuthority: false,
    authorityWeight: 0
  };
}

export class AlreadyVotedError extends Error {
  constructor() {
    super("You have already submitted your vote for this election.");
    this.name = "AlreadyVotedError";
  }
}

export interface SubmitVoteInput {
  electionId: string;
  voter: UserDoc;
  ctx: VoterContext;
  maleCandidateId: string | null;
  femaleCandidateId: string | null;
}

/**
 * Validates the selection against the voter's permitted categories and writes a single,
 * immutable vote document. Enforced atomically: a second call in the same transaction
 * (or any later call) fails because the document already exists.
 */
export async function submitVote(input: SubmitVoteInput, firestore: Firestore = db): Promise<void> {
  const { electionId, voter, ctx, maleCandidateId, femaleCandidateId } = input;
  const mId = maleCandidateId || null;
  const fId = femaleCandidateId || null;

  if (ctx.canVoteMale && ctx.canVoteFemale) {
    if (!mId || !fId) throw new Error("You must select one male and one female candidate.");
  } else if (ctx.canVoteMale) {
    if (!mId || fId) throw new Error("You may only vote for one male candidate.");
  } else if (ctx.canVoteFemale) {
    if (!fId || mId) throw new Error("You may only vote for one female candidate.");
  } else {
    throw new Error("You are not permitted to vote in this election.");
  }

  const voteRef = doc(firestore, "elections", electionId, "votes", voter.uid);

  await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(voteRef);
    if (snap.exists()) {
      throw new AlreadyVotedError();
    }
    const voteDoc: VoteDoc = {
      id: voter.uid,
      voterId: voter.uid,
      voterEmail: voter.email,
      voterKind: ctx.kind,
      maleCandidateId: mId,
      femaleCandidateId: fId,
      votedAt: Date.now()
    };
    tx.set(voteRef, voteDoc);
  });
}

export async function getVote(
  electionId: string,
  uid: string,
  firestore: Firestore = db
): Promise<VoteDoc | null> {
  const snap = await getDoc(doc(firestore, "elections", electionId, "votes", uid));
  return snap.exists() ? (snap.data() as VoteDoc) : null;
}

export async function hasVoted(electionId: string, uid: string, firestore: Firestore = db): Promise<boolean> {
  return (await getVote(electionId, uid, firestore)) !== null;
}
