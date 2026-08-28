// Central TypeScript domain types for the election platform.

export type UserRole = "admin" | "teacher" | "student" | "candidate";

export type Gender = "Male" | "Female";

export type ElectionStatus =
  | "UPCOMING"
  | "LIVE"
  | "VOTING_CLOSED"
  | "RESULT_PENDING"
  | "RESULTS_PUBLISHED";

export type EligibilityMode = "open" | "restricted";

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  // Optional role context for users who have a per-election authority assignment.
  createdAt: number;
  updatedAt: number;
}

export interface TeacherProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CandidateProfile {
  uid: string;
  email: string;
  name: string;
  gender: Gender;
  photoUrl: string;
  cloudinaryPublicId: string;
  promises: string[];
  candidateCode: string;
  profileCompleted: boolean;
  enrolledElectionIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AuthorityAssignments {
  hodEmail: string;
  hodUid: string | null;
  coordinatorEmail: string;
  coordinatorUid: string | null;
  counsellorEmail: string;
  counsellorUid: string | null;
}

export interface ElectionDoc {
  id: string;
  name: string;
  description: string;
  className: string;
  section: string;
  createdBy: string;
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  resultTime: number; // epoch ms
  eligibilityMode: EligibilityMode;
  status: ElectionStatus;
  authority: AuthorityAssignments;
  // weights (percentages, must sum to 100)
  studentWeight: number; // e.g. 70
  authorityWeightEach: number; // e.g. 10
  createdAt: number;
  updatedAt: number;
  finalized: boolean;
}

export interface ElectionCandidate {
  uid: string;
  candidateCode: string;
  name: string;
  gender: Gender;
  photoUrl: string;
  promises: string[];
  enrolledAt: number;
}

export type VoterKind = "student" | "candidate" | "hod" | "coordinator" | "counsellor";

export interface VoteDoc {
  id: string; // == voter uid
  voterId: string;
  voterEmail: string;
  voterKind: VoterKind;
  // Only one of these is set for candidates; both for students and authorities.
  maleCandidateId: string | null;
  femaleCandidateId: string | null;
  votedAt: number;
}

export interface EligibleStudent {
  email: string;
  addedAt: number;
  addedBy: string;
}

// ---- Result calculation types ----
export interface CandidateScore {
  uid: string;
  candidateCode: string;
  name: string;
  gender: Gender;
  photoUrl: string;
  promises: string[];
  studentVotes: number;
  studentVoteShare: number; // 0..1
  studentWeightedScore: number; // points
  hodScore: number;
  coordinatorScore: number;
  counsellorScore: number;
  totalScore: number; // 0..100
  rank: number;
  isWinner: boolean;
  tie: boolean;
}

export interface GenderResult {
  gender: Gender;
  totalValidVotes: number;
  candidates: CandidateScore[];
  winners: string[]; // uids of top 2
  hasTie: boolean;
}

export interface ElectionResult {
  electionId: string;
  male: GenderResult;
  female: GenderResult;
  calculatedAt: number;
  finalized: boolean;
  finalizedBy?: string;
  finalizedAt?: number;
}
