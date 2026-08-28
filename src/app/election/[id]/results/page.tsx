"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Lock, BarChart3, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading";
import { Countdown } from "@/components/ui/countdown";
import { getElection, getElectionCandidates } from "@/lib/services/electionService";
import { calculateResults, getStoredResult, storeResult } from "@/lib/services/resultService";
import type { ElectionDoc, ElectionCandidate, ElectionResult, ElectionStatus } from "@/lib/types";
import { computeElectionStatus, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const { userDoc } = useAuth();
  const [election, setElection] = useState<ElectionDoc | null>(null);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [result, setResult] = useState<ElectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    (async () => {
      const e = await getElection(id);
      setElection(e);
      if (!e) {
        setLoading(false);
        return;
      }
      const cs = await getElectionCandidates(id);
      setCandidates(cs);

      const now = Date.now();
      const isTeacherAdmin = userDoc?.role === "admin" || userDoc?.role === "teacher";

      if (now < e.resultTime) {
        setPending(false);
        setLoading(false);
        return;
      }
      // At/after result time
      if (e.finalized) {
        const stored = await getStoredResult(id);
        if (stored) {
          setResult(stored);
          setRevealed(true);
        }
      } else if (isTeacherAdmin) {
        // Authorized viewer publishes the result automatically at announcement time.
        const r = await calculateResults(e, cs);
        await storeResult(id, r, true, userDoc?.uid);
        setResult(r);
        setRevealed(true);
      } else {
        // Wait for publication
        setPending(true);
      }
      setLoading(false);
    })();
  }, [id, userDoc]);

  useEffect(() => {
    if (revealed && result) {
      const end = Date.now() + 1200;
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors: ["#ffe17c", "#b7c6c2", "#171e19"] });
        confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors: ["#ffe17c", "#b7c6c2", "#171e19"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [revealed, result]);

  if (loading) return <LoadingScreen label="Loading results…" />;
  if (!election) return <LoadingScreen label="Election not found." />;

  const status = computeElectionStatus(election);

  if (!revealed && !pending && Date.now() < election.resultTime) {
    return (
      <Main election={election} status={status}>
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Lock className="h-10 w-10" />
            <h2 className="font-heading text-2xl font-extrabold">Results not yet announced</h2>
            <Countdown target={election.resultTime} label="Results in" />
          </CardContent>
        </Card>
      </Main>
    );
  }

  if (pending) {
    return (
      <Main election={election} status={status}>
        <Card className="mx-auto max-w-lg">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-10 w-10 text-orange-500" />
            <h2 className="font-heading text-2xl font-extrabold">Awaiting publication</h2>
            <p className="text-sm text-muted-foreground">Results are being finalized by the election authority.</p>
          </CardContent>
        </Card>
      </Main>
    );
  }

  if (!result) return <LoadingScreen label="Preparing results…" />;

  return (
    <Main election={election} status={status}>
      {result.male.hasTie || result.female.hasTie ? (
        <div className="mb-4 flex items-center gap-2 rounded-md border-2 border-black bg-orange-100 p-3 text-sm font-bold">
          <AlertTriangle className="h-4 w-4" /> A tie affects the top positions — pending resolution by Class Counsellor & Coordinator.
        </div>
      ) : null}

      {(["Male", "Female"] as const).map((g, gi) => {
        const grp = result[g.toLowerCase() as "male" | "female"];
        return (
          <div key={g} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-2xl font-extrabold">
              <Trophy className="h-6 w-6" /> {g} Category Winners
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {grp.candidates.map((c, i) => (
                <motion.div
                  key={c.uid}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.3 + i * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                >
                  <Card className={c.isWinner ? "bg-brand-yellow" : ""}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 overflow-hidden rounded-md border-2 border-black">
                          {c.photoUrl && <img src={c.photoUrl} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-heading text-xl font-extrabold">{c.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-white">Rank {c.rank}</Badge>
                            {c.isWinner && <Badge className="bg-green-300">WINNER</Badge>}
                          </div>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="font-heading text-3xl font-extrabold">{c.totalScore.toFixed(1)}</p>
                          <p className="text-xs font-bold uppercase">/ 100</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-bold">
                        <ScoreBox label="Student" value={`${c.studentWeightedScore.toFixed(0)}`} sub={`${(c.studentVoteShare * 100).toFixed(0)}%`} />
                        <ScoreBox label="HOD" value={`${c.hodScore}`} />
                        <ScoreBox label="Coord" value={`${c.coordinatorScore}`} />
                        <ScoreBox label="Couns" value={`${c.counsellorScore}`} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-center">
        <Link href={`/election/${id}`}><Button variant="outline">Back to Election</Button></Link>
      </div>
    </Main>
  );
}

function ScoreBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border-2 border-black bg-white p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-extrabold">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Main({ election, status, children }: { election: ElectionDoc; status: ElectionStatus; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <span className="text-xs font-bold uppercase text-muted-foreground">Election Results</span>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">{election.name}</h1>
          <p className="text-sm text-muted-foreground">{election.className} — Section {election.section}</p>
          <div className="mt-2 flex justify-center"><Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge></div>
        </div>
        {children}
      </div>
    </main>
  );
}
