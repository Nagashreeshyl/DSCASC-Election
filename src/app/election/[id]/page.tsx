"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Vote, BarChart3, Users2, Scale } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading";
import { Countdown } from "@/components/ui/countdown";
import { CandidateCard } from "@/components/election/CandidateCard";
import { getElection, getElectionCandidates } from "@/lib/services/electionService";
import { hasVoted } from "@/lib/services/voteService";
import type { ElectionDoc, ElectionCandidate } from "@/lib/types";
import { computeElectionStatus, STATUS_COLORS, STATUS_LABELS, formatDate } from "@/lib/utils";

export default function ElectionInfoPage() {
  const params = useParams();
  const id = params.id as string;
  const { fbUser, userDoc } = useAuth();
  const [election, setElection] = useState<ElectionDoc | null>(null);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const e = await getElection(id);
      setElection(e);
      if (e) {
        setCandidates(await getElectionCandidates(id));
        if (fbUser) setVoted(!!(await hasVoted(id, fbUser.uid)));
      }
      setLoading(false);
    })();
  }, [id, fbUser]);

  if (loading) return <LoadingScreen label="Loading election…" />;
  if (!election) return <LoadingScreen label="Election not found." />;

  const status = computeElectionStatus(election);
  const male = candidates.filter((c) => c.gender === "Male");
  const female = candidates.filter((c) => c.gender === "Female");
  const home = userDoc ? `/${userDoc.role}` : "/login";

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={home} className="text-xs font-bold text-muted-foreground hover:underline">← Dashboard</Link>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">{election.name}</h1>
            <p className="text-sm text-muted-foreground">{election.className} — Section {election.section}</p>
          </div>
          <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard icon={Users2} label="Starts" value={formatDate(election.startTime)} />
          <InfoCard icon={BarChart3} label="Ends" value={formatDate(election.endTime)} />
          <InfoCard icon={Scale} label="Results" value={formatDate(election.resultTime)} />
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle>Weightage — 100% Voting Authority</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <WeightRow label={`${election.className} Students`} pct={election.studentWeight} />
            <WeightRow label="HOD" pct={election.authorityWeightEach} />
            <WeightRow label="I Year Coordinator" pct={election.authorityWeightEach} />
            <WeightRow label="Class Counsellor" pct={election.authorityWeightEach} />
            <p className="pt-2 text-xs text-muted-foreground">Please vote thoughtfully and choose candidates who can genuinely represent, support and coordinate {election.className} — Section {election.section}.</p>
          </CardContent>
        </Card>

        <div className="my-6 flex flex-wrap justify-center gap-3">
          {status === "LIVE" && !voted && (
            <Link href={`/election/${id}/vote`}><Button size="lg" className="bg-black text-white"><Vote className="h-4 w-4" /> Vote Now</Button></Link>
          )}
          {voted && <Badge className="bg-green-300">You have voted</Badge>}
          {(status === "RESULTS_PUBLISHED" || status === "RESULT_PENDING") && (
            <Link href={`/election/${id}/results`}><Button variant="outline"><BarChart3 className="h-4 w-4" /> View Results</Button></Link>
          )}
          {status === "UPCOMING" && <Countdown target={election.startTime} label="Voting opens in" />}
          {status === "LIVE" && <Countdown target={election.endTime} label="Voting closes in" />}
          {(status === "VOTING_CLOSED" || status === "RESULT_PENDING") && <Countdown target={election.resultTime} label="Results in" />}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 font-heading text-xl font-extrabold">Male Candidates ({male.length})</h2>
            <div className="space-y-3">
              {male.map((c) => <CandidateCard key={c.uid} candidate={c} />)}
              {male.length === 0 && <p className="text-sm text-muted-foreground">None enrolled yet.</p>}
            </div>
          </div>
          <div>
            <h2 className="mb-2 font-heading text-xl font-extrabold">Female Candidates ({female.length})</h2>
            <div className="space-y-3">
              {female.map((c) => <CandidateCard key={c.uid} candidate={c} />)}
              {female.length === 0 && <p className="text-sm text-muted-foreground">None enrolled yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ icon: I, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-brand-sage"><I className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WeightRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center justify-between border-b border-black/10 pb-1">
      <span className="font-semibold">{label}</span>
      <span className="font-extrabold">{pct}%</span>
    </div>
  );
}
