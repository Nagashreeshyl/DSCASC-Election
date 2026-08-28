"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Vote, CalendarClock, Radio, CheckCircle2, Lock } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen, SkeletonCard } from "@/components/ui/loading";
import { Countdown } from "@/components/ui/countdown";
import { useAuth } from "@/lib/hooks/useAuth";
import { listElections } from "@/lib/services/electionService";
import { getVote } from "@/lib/services/voteService";
import type { ElectionDoc } from "@/lib/types";
import { computeElectionStatus, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

const NAV: NavItem[] = [{ href: "/student", label: "Elections", icon: Vote }];

export default function StudentPage() {
  return (
    <RoleGuard allow={["student"]}>
      <StudentInner />
    </RoleGuard>
  );
}

function StudentInner() {
  const { userDoc } = useAuth();
  const [elections, setElections] = useState<ElectionDoc[]>([]);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!userDoc) return;
    const list = await listElections();
    setElections(list);
    const v: Record<string, boolean> = {};
    await Promise.all(
      list.map(async (e) => {
        v[e.id] = !!(await getVote(e.id, userDoc.uid));
      })
    );
    setVoted(v);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDoc]);

  const grouped = (status: string) => elections.filter((e) => computeElectionStatus(e) === status);
  const live = grouped("LIVE");
  const upcoming = grouped("UPCOMING");
  const closed = elections.filter((e) =>
    ["VOTING_CLOSED", "RESULT_PENDING", "RESULTS_PUBLISHED"].includes(computeElectionStatus(e))
  );

  if (loading) return <LoadingScreen label="Loading elections…" />;

  return (
    <DashboardShell role="student" nav={NAV}>
      <h1 className="mb-1 font-heading text-3xl font-extrabold tracking-tight">Student Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">Review candidates and cast your secure vote.</p>

      <Section title="Live Now" icon={Radio} elections={live} voted={voted} cta="Vote Now" />
      <Section title="Upcoming" icon={CalendarClock} elections={upcoming} voted={voted} cta="View" />
      <Section title="Closed & Results" icon={CheckCircle2} elections={closed} voted={voted} cta="Details" />
    </DashboardShell>
  );
}

function Section({
  title,
  icon: I,
  elections,
  voted,
  cta
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  elections: ElectionDoc[];
  voted: Record<string, boolean>;
  cta: string;
}) {
  if (elections.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-xl font-extrabold">
        <I className="h-5 w-5" /> {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {elections.map((e) => {
          const status = computeElectionStatus(e);
          return (
            <Card key={e.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{e.name}</CardTitle>
                <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{e.className} — Section {e.section}</p>
                {status === "UPCOMING" && <Countdown target={e.startTime} label="Voting starts in" />}
                {status === "LIVE" && <Countdown target={e.endTime} label="Voting ends in" />}
                {(status === "VOTING_CLOSED" || status === "RESULT_PENDING") && (
                  <Countdown target={e.resultTime} label="Results in" />
                )}
                <div className="flex items-center gap-2 pt-1">
                  {voted[e.id] && <Badge className="bg-green-300"><CheckCircle2 className="h-3 w-3" /> Voted</Badge>}
                  <Link href={`/election/${e.id}`} className="ml-auto">
                    <Button size="sm" variant={status === "LIVE" ? "primary" : "outline"}>
                      {voted[e.id] ? "View" : cta}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
