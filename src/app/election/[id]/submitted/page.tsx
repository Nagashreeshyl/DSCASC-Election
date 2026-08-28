"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Lock, PartyPopper } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading";
import { Countdown } from "@/components/ui/countdown";
import { getElection } from "@/lib/services/electionService";
import { hasVoted } from "@/lib/services/voteService";
import { computeElectionStatus, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

export default function SubmittedPage() {
  const params = useParams();
  const id = params.id as string;
  const { fbUser, userDoc, loading: authLoading } = useAuth();
  const [election, setElection] = useState<any>(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!fbUser) return;
    (async () => {
      const e = await getElection(id);
      setElection(e);
      setVoted(!!(await hasVoted(id, fbUser.uid)));
      setLoading(false);
    })();
  }, [authLoading, fbUser, id]);

  if (loading) return <LoadingScreen label="Confirming…" />;
  if (!election) return <LoadingScreen label="Election not found." />;

  const status = computeElectionStatus(election);

  if (!voted) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="py-10 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10" />
            <h2 className="font-heading text-xl font-extrabold">No vote recorded</h2>
            <p className="mt-2 text-sm text-muted-foreground">You have not submitted a vote for this election.</p>
            <Link href={`/election/${id}/vote`} className="mt-4 inline-block"><Button className="bg-black text-white">Go to Vote</Button></Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-yellow px-4" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.10) 2px, transparent 2px)", backgroundSize: "32px 32px" }}>
      <Card className="max-w-lg text-center shadow-brutal-xl">
        <CardContent className="py-12">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-black bg-green-300">
            <CheckCircle2 className="h-12 w-12 text-black" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">Vote Successfully Submitted</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Your vote has been securely recorded. It cannot be changed.</p>

          <div className="mt-6 flex justify-center">
            <Countdown target={election.resultTime} label="Results announced in" />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link href={`/election/${id}/results`}><Button className="w-full bg-black text-white">View Results Page</Button></Link>
            {userDoc && (
              <Link href={`/${userDoc.role}`} className="text-xs font-bold text-muted-foreground hover:underline">Back to dashboard</Link>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
