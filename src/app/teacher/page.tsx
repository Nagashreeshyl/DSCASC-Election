"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Radio, CalendarClock, CheckCircle2, BarChart3 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { DateTimePickerField } from "@/components/ui/datetime-picker";
import { LoadingScreen, SkeletonCard } from "@/components/ui/loading";
import { Countdown } from "@/components/ui/countdown";
import { useAuth } from "@/lib/hooks/useAuth";
import { listElections, createElection } from "@/lib/services/electionService";
import type { ElectionDoc } from "@/lib/types";
import { computeElectionStatus, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import { electionSchema, type ElectionFormInput } from "@/lib/schemas";
import { DEFAULT_STUDENT_WEIGHT, DEFAULT_AUTHORITY_WEIGHT } from "@/lib/config";

const NAV: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: Radio },
  { href: "/teacher", label: "Elections", icon: CalendarClock }
];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherPage() {
  return (
    <RoleGuard allow={["teacher", "admin"]}>
      <TeacherInner />
    </RoleGuard>
  );
}

function TeacherInner() {
  const { userDoc } = useAuth();
  const [elections, setElections] = useState<ElectionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    className: "BBA",
    section: "B",
    startDate: todayDate(),
    startTime: "09:00",
    endDate: todayDate(),
    endTime: "17:00",
    resultDate: todayDate(),
    resultTime: "18:00",
    eligibilityMode: "open" as "open" | "restricted",
    studentWeight: DEFAULT_STUDENT_WEIGHT,
    authorityWeightEach: DEFAULT_AUTHORITY_WEIGHT
  });

  async function load() {
    setLoading(true);
    setElections(await listElections());
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(k: keyof typeof form, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleCreate() {
    setError(null);
    const parsed = electionSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Please fix the form.");
      return;
    }
    if (!userDoc) return;
    setBusy(true);
    try {
      const id = await createElection(parsed.data as ElectionFormInput, userDoc.uid);
      setOpen(false);
      setForm((f) => ({ ...f, name: "", description: "" }));
      await load();
    } catch (e) {
      setError("Could not create election.");
    }
    setBusy(false);
  }

  const statusGroups = (s: string) => elections.filter((e) => computeElectionStatus(e) === s);
  const live = statusGroups("LIVE").length;
  const upcoming = statusGroups("UPCOMING").length;
  const published = statusGroups("RESULTS_PUBLISHED").length;

  return (
    <DashboardShell role="teacher" nav={NAV}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">Teacher Dashboard</h1>
          <p className="text-sm text-muted-foreground">Create and manage Class Representative elections.</p>
        </div>
        <Button className="bg-black text-white" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create Election
        </Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Stat icon={Radio} label="Live" value={live} />
        <Stat icon={CalendarClock} label="Upcoming" value={upcoming} />
        <Stat icon={CheckCircle2} label="Published" value={published} />
      </div>

      <h2 className="mb-3 font-heading text-xl font-extrabold">Your Elections</h2>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : elections.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No elections yet. Create your first one.</CardContent></Card>
      ) : (
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
                  <p className="text-xs">{e.eligibilityMode === "open" ? "Open voting" : "Restricted eligibility"}</p>
                  {status === "UPCOMING" && <Countdown target={e.startTime} label="Starts in" />}
                  {status === "LIVE" && <Countdown target={e.endTime} label="Ends in" />}
                  <div className="flex gap-2 pt-1">
                    <Link href={`/teacher/election/${e.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-black text-white">Manage</Button>
                    </Link>
                    <Link href={`/election/${e.id}/results`}>
                      <Button size="sm" variant="outline"><BarChart3 className="h-4 w-4" /></Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Election">
        <div className="space-y-4">
          {error && <p className="rounded-md border-2 border-black bg-red-100 p-2 text-sm font-semibold text-destructive">{error}</p>}
          <div>
            <Label>Election Name</Label>
            <Input className="mt-1" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="I Semester BBA – Section B CR Election" />
          </div>
          <div>
            <Label>Description</Label>
            <Input className="mt-1" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Class</Label>
              <Input className="mt-1" value={form.className} onChange={(e) => update("className", e.target.value)} />
            </div>
            <div>
              <Label>Section</Label>
              <Input className="mt-1" value={form.section} onChange={(e) => update("section", e.target.value)} />
            </div>
          </div>
          <DateTimePickerField label="Start (voting opens)" dateValue={form.startDate} timeValue={form.startTime} onDateChange={(v) => update("startDate", v)} onTimeChange={(v) => update("startTime", v)} />
          <DateTimePickerField label="End (voting closes)" dateValue={form.endDate} timeValue={form.endTime} onDateChange={(v) => update("endDate", v)} onTimeChange={(v) => update("endTime", v)} />
          <DateTimePickerField label="Result Announcement" dateValue={form.resultDate} timeValue={form.resultTime} onDateChange={(v) => update("resultDate", v)} onTimeChange={(v) => update("resultTime", v)} />
          <div>
            <Label>Eligibility Mode</Label>
            <Select className="mt-1" value={form.eligibilityMode} onChange={(e) => update("eligibilityMode", e.target.value)}>
              <option value="open">Open (any authenticated student)</option>
              <option value="restricted">Restricted (eligible list only)</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Student Weight %</Label>
              <Input className="mt-1" type="number" value={form.studentWeight} onChange={(e) => update("studentWeight", Number(e.target.value))} />
            </div>
            <div>
              <Label>Each Authority %</Label>
              <Input className="mt-1" type="number" value={form.authorityWeightEach} onChange={(e) => update("authorityWeightEach", Number(e.target.value))} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Weights must sum to 100% (Student + 3 authorities). Authority roles are assigned next.</p>
          <Button className="w-full bg-black text-white" onClick={handleCreate} disabled={busy}>
            {busy ? "Creating…" : "Create Election"}
          </Button>
        </div>
      </Modal>
    </DashboardShell>
  );
}

function Stat({ icon: I, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-brand-sage"><I className="h-6 w-6" /></div>
        <div>
          <p className="text-3xl font-extrabold">{value}</p>
          <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
