import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ElectionStatus, ElectionDoc, Gender } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDateShort(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// Computes the authoritative election status from timestamps.
export function computeElectionStatus(
  election: Pick<ElectionDoc, "startTime" | "endTime" | "resultTime" | "finalized">
): ElectionStatus {
  const now = Date.now();
  if (election.finalized && now >= election.resultTime) return "RESULTS_PUBLISHED";
  if (now < election.startTime) return "UPCOMING";
  if (now < election.endTime) return "LIVE";
  if (now < election.resultTime) return "VOTING_CLOSED"; // voting closed, results pending
  // now >= resultTime
  return election.finalized ? "RESULTS_PUBLISHED" : "RESULT_PENDING";
}

export const STATUS_LABELS: Record<ElectionStatus, string> = {
  UPCOMING: "Upcoming",
  LIVE: "Live",
  VOTING_CLOSED: "Voting Closed",
  RESULT_PENDING: "Results Pending",
  RESULTS_PUBLISHED: "Results Published"
};

export const STATUS_COLORS: Record<ElectionStatus, string> = {
  UPCOMING: "bg-sage text-charcoal",
  LIVE: "bg-green-400 text-black",
  VOTING_CLOSED: "bg-yellow-300 text-black",
  RESULT_PENDING: "bg-orange-300 text-black",
  RESULTS_PUBLISHED: "bg-brand-yellow text-charcoal"
};

export const GENDER_OPTIONS: Gender[] = ["Male", "Female"];

const CANDIDATE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

export function generateCandidateCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CANDIDATE_CODE_ALPHABET[Math.floor(Math.random() * CANDIDATE_CODE_ALPHABET.length)];
  }
  return code;
}

export async function uniqueCandidateCode(isTaken: (code: string) => Promise<boolean>): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateCandidateCode();
    if (!(await isTaken(code))) return code;
  }
  throw new Error("Unable to generate a unique candidate code. Please try again.");
}

export function isEmailAllowed(email: string, allowed: string[]): boolean {
  const normalized = email.trim().toLowerCase();
  return allowed.some((e) => e.trim().toLowerCase() === normalized);
}
