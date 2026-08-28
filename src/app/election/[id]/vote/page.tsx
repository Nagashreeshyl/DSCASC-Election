"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Lock, CheckCircle2, Vote, Info } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingScreen } from "@/components/ui/loading";
import { Countdown } from "@/components/ui/countdown";
import { CandidateCard } from "@/components/election/CandidateCard";
import {
  getElection,
  getElectionCandidates,
  getEligibleStudentDoc
} from "@/lib/services/electionService";
import { getCandidateProfile } from "@/lib/services/userService";
import { getVote, hasVoted, submitVote, getVoterContext } from "@/lib/services/voteService";
import type { ElectionDoc, ElectionCandidate, VoteDoc, ElectionStatus } from "@/lib/types";
import { computeElectionStatus, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

const AUTHORITY_LABEL: Record<string, string> = {
  hod: "HOD Voting Authority",
  coordinator: "I Year Coordinator Voting Authority",
  counsellor: "Class Counsellor Voting Authority"
};

export default function VotePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { fbUser, userDoc, loading: authLoading } = useAuth();

  const [election, setElection] = useState<ElectionDoc | null>(null);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ReturnType<typeof computeElectionStatus>>("UPCOMING");
  const [maleSel, setMaleSel] = useState<string | null>(null);
  const [femaleSel, setFemaleSel] = useState<string | null>(null);
  const [canVoteMale, setCanVoteMale] = useState(true);
  const [canVoteFemale, setCanVoteFemale] = useState(true);
  const [voterKindLabel, setVoterKindLabel] = useState<string | null>(null);
  const [isCandidateVoter, setIsCandidateVoter] = useState(false);
  const [eligible, setEligible] = useState(true);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notEnrolled, setNotEnrolled] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!fbUser) {
      router.replace(`/login`);
      return;
    }
    (async () => {
      const e = await getElection(id);
      if (!e) {
        setLoading(false);
        return;
      }
      setElection(e);
      const cs = await getElectionCandidates(id);
      setCandidates(cs);
      setStatus(computeElectionStatus(e));

      const voted = await hasVoted(id, fbUser.uid);
      if (voted) {
        setAlreadyVoted(true);
        setLoading(false);
        return;
      }

      // Determine voter context
      let candidateGender: "Male" | "Female" | undefined;
      if (userDoc?.role === "candidate") {
        const prof = await getCandidateProfile(fbUser.uid);
        candidateGender = prof?.gender;
        const enrolled = cs.some((c) => c.uid === fbUser.uid);
        if (!enrolled) {
          setNotEnrolled(true);
          setLoading(false);
          return;
        }
      }

      const ctx = getVoterContext(userDoc!, e, candidateGender);
      setCanVoteMale(ctx.canVoteMale);
      setCanVoteFemale(ctx.canVoteFemale);
      if (ctx.isAuthority) setVoterKindLabel(AUTHORITY_LABEL[ctx.kind] || "Voting Authority");
      if (userDoc?.role === "candidate") {
        setIsCandidateVoter(true);
        setVoterKindLabel("Candidate Voter (opposite gender only)");
      }

      // Eligibility for students
      if (ctx.kind === "student" && e.eligibilityMode === "restricted") {
        const doc = await getEligibleStudentDoc(id, fbUser.email || "");
        setEligible(!!doc);
      }

      setLoading(false);
    })();
  }, [authLoading, fbUser, userDoc, id, router]);

  const male = candidates.filter((c) => c.gender === "Male");
  const female = candidates.filter((c) => c.gender === "Female");

  async function doSubmit() {
    if (!userDoc || !election) return;
    setBusy(true);
    setError(null);
    try {
      let candidateGender: "Male" | "Female" | undefined;
      if (userDoc.role === "candidate") {
        const prof = await getCandidateProfile(userDoc.uid);
        candidateGender = prof?.gender;
      }
      const ctx = getVoterContext(userDoc, election, candidateGender);
      await submitVote({
        electionId: id,
        voter: userDoc,
        ctx,
        maleCandidateId: canVoteMale ? maleSel : null,
        femaleCandidateId: canVoteFemale ? femaleSel : null
      });
      router.replace(`/election/${id}/submitted`);
    } catch (err: any) {
      setError(err?.message || "Submission failed.");
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  if (authLoading || loading) return <LoadingScreen label="Preparing ballot…" />;
  if (!election) return <LoadingScreen label="Election not found." />;

  if (alreadyVoted) {
    return (
      <Shell election={election} status={status}>
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <h2 className="font-heading text-2xl font-extrabold">You have already voted</h2>
            <p className="text-sm text-muted-foreground">Your vote is securely recorded and cannot be changed.</p>
            <Link href={`/election/${id}/submitted`}><Button className="bg-black text-white">View status</Button></Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (status === "UPCOMING") {
    return (
      <Shell election={election} status={status}>
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Lock className="h-10 w-10" />
            <h2 className="font-heading text-2xl font-extrabold">Voting has not started</h2>
            <Countdown target={election.startTime} label="Opens in" />
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (status !== "LIVE") {
    return (
      <Shell election={election} status={status}>
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Info className="h-10 w-10" />
            <h2 className="font-heading text-2xl font-extrabold">Voting is closed</h2>
            <p className="text-sm text-muted-foreground">Results will be published at the scheduled time.</p>
            <Link href={`/election/${id}/results`}><Button variant="outline">View Results</Button></Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (notEnrolled) {
    return (
      <Shell election={election} status={status}>
        <Card className="mx-auto max-w-lg">
          <CardContent className="py-10 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-orange-500" />
            <h2 className="font-heading text-xl font-extrabold">Not enrolled as a candidate</h2>
            <p className="mt-2 text-sm text-muted-foreground">You must be enrolled by your teacher to vote as a candidate.</p>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (!eligible) {
    return (
      <Shell election={election} status={status}>
        <Card className="mx-auto max-w-lg">
          <CardContent className="py-10 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10" />
            <h2 className="font-heading text-xl font-extrabold">Not eligible to vote</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your email is not on this election&apos;s eligible student list.</p>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  const ready = (canVoteMale ? maleSel : true) && (canVoteFemale ? femaleSel : true);

  return (
    <Shell election={election} status={status}>
      {voterKindLabel && (
        <div className="mb-4 flex items-center gap-2 rounded-md border-2 border-black bg-brand-yellowMuted p-3 text-sm font-semibold">
          <Info className="h-4 w-4" /> {voterKindLabel}
          {isCandidateVoter && " — you may vote only for the opposite gender."}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Male Candidates"
          locked={!canVoteMale}
          candidates={male}
          selected={maleSel}
          onSelect={setMaleSel}
          reason="As a candidate, you vote only for the opposite gender."
        />
        <Section
          title="Female Candidates"
          locked={!canVoteFemale}
          candidates={female}
          selected={femaleSel}
          onSelect={setFemaleSel}
          reason="As a candidate, you vote only for the opposite gender."
        />
      </div>

      {error && <p className="mt-4 text-center text-sm font-semibold text-destructive">{error}</p>}

      <div className="mt-6 flex justify-center">
        <Button size="lg" className="bg-black text-white" disabled={!ready || busy} onClick={() => setConfirmOpen(true)}>
          <Vote className="h-4 w-4" /> Submit Vote
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Your Vote">
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-md border-2 border-black bg-red-100 p-3 text-sm font-semibold">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Once your vote is submitted, it cannot be changed.
          </div>
          {canVoteMale && (
            <ConfirmRow label="Male candidate" name={male.find((c) => c.uid === maleSel)?.name || "—"} />
          )}
          {canVoteFemale && (
            <ConfirmRow label="Female candidate" name={female.find((c) => c.uid === femaleSel)?.name || "—"} />
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button className="flex-1 bg-black text-white" disabled={busy} onClick={doSubmit}>
              {busy ? "Submitting…" : "Confirm & Submit"}
            </Button>
          </div>
        </div>
      </Modal>
    </Shell>
  );
}

function Shell({ election, status, children }: { election: ElectionDoc; status: ElectionStatus; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/election/${election.id}`} className="text-xs font-bold text-muted-foreground hover:underline">← Election details</Link>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">{election.name}</h1>
            <p className="text-sm text-muted-foreground">{election.className} — Section {election.section}</p>
          </div>
          <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
        </div>
        {children}
      </div>
    </main>
  );
}

function Section({ title, locked, candidates, selected, onSelect, reason }: {
  title: string;
  locked: boolean;
  candidates: ElectionCandidate[];
  selected: string | null;
  onSelect: (uid: string) => void;
  reason: string;
}) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-xl font-extrabold">{title}</h2>
      {locked && (
        <div className="mb-3 flex items-center gap-2 rounded-md border-2 border-black bg-muted p-3 text-sm">
          <Lock className="h-4 w-4" /> {reason}
        </div>
      )}
      <div className={locked ? "pointer-events-none space-y-3 opacity-50" : "space-y-3"}>
        {candidates.map((c) => (
          <CandidateCard
            key={c.uid}
            candidate={c}
            selected={selected === c.uid}
            onSelect={() => onSelect(c.uid)}
            disabled={locked}
          />
        ))}
        {candidates.length === 0 && <p className="text-sm text-muted-foreground">No candidates in this category.</p>}
      </div>
    </div>
  );
}

function ConfirmRow({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex justify-between border-b-2 border-black pb-2">
      <span className="font-bold uppercase text-muted-foreground">{label}</span>
      <span className="font-heading text-lg font-extrabold">{name}</span>
    </div>
  );
}
