"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import {
  Users,
  UserPlus,
  Trash2,
  QrCode,
  Copy,
  Download,
  ShieldCheck,
  BarChart3,
  Settings2,
  CheckCircle2,
  Lock,
  Info,
  Trophy
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingScreen } from "@/components/ui/loading";
import { Countdown } from "@/components/ui/countdown";
import { CandidateCard } from "@/components/election/CandidateCard";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getElection,
  getElectionCandidates,
  enrollCandidate,
  removeCandidate,
  getCandidateByCode,
  setAuthority,
  addEligibleStudent,
  removeEligibleStudent,
  listEligibleStudents,
  addCandidateEmail,
  updateElectionTimes
} from "@/lib/services/electionService";
import { calculateResults, storeResult, getStoredResult } from "@/lib/services/resultService";
import type { ElectionDoc, ElectionCandidate, EligibleStudent, CandidateProfile, ElectionResult } from "@/lib/types";
import { computeElectionStatus, STATUS_COLORS, STATUS_LABELS, formatDate } from "@/lib/utils";
import { authoritySchema, enrollCandidateSchema, addStudentSchema } from "@/lib/schemas";

const NAV: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: Users },
  { href: "/teacher", label: "This Election", icon: Settings2 }
];

export default function TeacherElectionPage() {
  return (
    <RoleGuard allow={["teacher", "admin"]}>
      <TeacherElectionInner />
    </RoleGuard>
  );
}

function TeacherElectionInner() {
  const params = useParams();
  const id = params.id as string;
  const { userDoc } = useAuth();
  const [election, setElection] = useState<ElectionDoc | null>(null);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  async function load() {
    const e = await getElection(id);
    setElection(e);
    if (e) setCandidates(await getElectionCandidates(id));
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <LoadingScreen label="Loading election…" />;
  if (!election) return <LoadingScreen label="Election not found." />;

  const status = computeElectionStatus(election);
  const canManage = userDoc?.role === "admin" || userDoc?.uid === election.createdBy;

  return (
    <DashboardShell role="teacher" nav={NAV}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/teacher" className="text-xs font-bold text-muted-foreground hover:underline">← All elections</Link>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">{election.name}</h1>
          <p className="text-sm text-muted-foreground">{election.className} — Section {election.section}</p>
        </div>
        <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
      </div>

      <Tabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "candidates", label: "Candidates" },
          { value: "voters", label: "Voters" },
          { value: "authorities", label: "Authorities" },
          { value: "share", label: "QR & Share" },
          { value: "results", label: "Results" },
          { value: "settings", label: "Settings" }
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-6">
        {tab === "overview" && <OverviewTab election={election} candidates={candidates} onManage={() => setTab("candidates")} />}
        {tab === "candidates" && <CandidatesTab electionId={id} candidates={candidates} canManage={canManage} refresh={load} />}
        {tab === "voters" && <VotersTab electionId={id} election={election} canManage={canManage} />}
        {tab === "authorities" && <AuthoritiesTab election={election} canManage={canManage} refresh={load} />}
        {tab === "share" && <ShareTab electionId={id} />}
        {tab === "results" && <ResultsTab election={election} candidates={candidates} canManage={canManage} refresh={load} />}
        {tab === "settings" && <SettingsTab election={election} canManage={canManage} refresh={load} />}
      </div>
    </DashboardShell>
  );
}

function OverviewTab({ election, candidates, onManage }: { election: ElectionDoc; candidates: ElectionCandidate[]; onManage: () => void }) {
  const male = candidates.filter((c) => c.gender === "Male").length;
  const female = candidates.filter((c) => c.gender === "Female").length;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Starts" value={formatDate(election.startTime)} />
          <Row label="Ends" value={formatDate(election.endTime)} />
          <Row label="Results" value={formatDate(election.resultTime)} />
          <Row label="Eligibility" value={election.eligibilityMode === "open" ? "Open" : "Restricted"} />
          <Row label="Weights" value={`Student ${election.studentWeight}% · Authority ${election.authorityWeightEach}% each`} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Enrollment</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Badge className="bg-brand-sage">Male: {male}</Badge>
            <Badge className="bg-pink-200">Female: {female}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">4 CRs will be selected (2 Male, 2 Female).</p>
          <Button className="w-full bg-black text-white" onClick={onManage}><UserPlus className="h-4 w-4" /> Manage Candidates</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-black/10 pb-2">
      <span className="font-bold uppercase text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function CandidatesTab({ electionId, candidates, canManage, refresh }: { electionId: string; candidates: ElectionCandidate[]; canManage: boolean; refresh: () => void }) {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<CandidateProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newCandEmail, setNewCandEmail] = useState("");
  const [candMsg, setCandMsg] = useState<string | null>(null);
  const male = candidates.filter((c) => c.gender === "Male");
  const female = candidates.filter((c) => c.gender === "Female");

  async function addEmail() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newCandEmail)) {
      setCandMsg("Enter a valid email.");
      return;
    }
    setBusy(true);
    await addCandidateEmail(newCandEmail, "teacher");
    setNewCandEmail("");
    setCandMsg("Candidate invited. They can now sign in and complete their profile.");
    setBusy(false);
  }

  async function lookup() {
    setErr(null);
    const parsed = enrollCandidateSchema.safeParse({ candidateCode: code.toUpperCase() });
    if (!parsed.success) {
      setErr("Enter a valid 5-character code.");
      return;
    }
    const p = await getCandidateByCode(code.toUpperCase());
    if (!p) {
      setErr("No candidate found with this code.");
      setPreview(null);
      return;
    }
    setPreview(p);
  }

  async function confirmEnroll() {
    if (!preview) return;
    setBusy(true);
    try {
      await enrollCandidate(electionId, preview);
      setCode("");
      setPreview(null);
      await refresh();
    } catch (e) {
      setErr("Enrollment failed.");
    }
    setBusy(false);
  }

  async function remove(uid: string) {
    if (!window.confirm("Remove this candidate from the election?")) return;
    await removeCandidate(electionId, uid);
    await refresh();
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader><CardTitle>Step 1 — Assign Candidate Role</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Add the candidate&apos;s Google email to grant them the Candidate role. They sign in and complete a profile to get a code.</p>
            <div className="flex gap-2">
              <Input placeholder="candidate@college.edu" value={newCandEmail} onChange={(e) => setNewCandEmail(e.target.value)} />
              <Button onClick={addEmail} disabled={busy} className="bg-black text-white">Invite</Button>
            </div>
            {candMsg && <p className="text-sm font-semibold text-green-700">{candMsg}</p>}
          </CardContent>
        </Card>
      )}

      {canManage && (
        <Card>
          <CardHeader><CardTitle>Step 2 — Enroll Candidate by Code</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="A7X2K" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="font-mono" />
              <Button onClick={lookup} variant="outline">Lookup</Button>
            </div>
            {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
            {preview && (
              <div className="rounded-md border-2 border-black bg-brand-yellowMuted p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-md border-2 border-black">
                    {preview.photoUrl && <img src={preview.photoUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-bold">{preview.name}</p>
                    <p className="text-xs">{preview.gender} · {preview.candidateCode}</p>
                  </div>
                  <Button className="ml-auto bg-black text-white" onClick={confirmEnroll} disabled={busy}>Enroll</Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Candidate gender is taken from their profile — they are sorted automatically.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-heading text-lg font-extrabold">Male Candidates ({male.length})</h3>
          <div className="space-y-3">
            {male.map((c) => (
              <div key={c.uid} className="relative">
                <CandidateCard candidate={c} />
                {canManage && <Button size="sm" variant="destructive" className="absolute right-3 top-3" onClick={() => remove(c.uid)}><Trash2 className="h-3 w-3" /></Button>}
              </div>
            ))}
            {male.length === 0 && <p className="text-sm text-muted-foreground">None enrolled.</p>}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-heading text-lg font-extrabold">Female Candidates ({female.length})</h3>
          <div className="space-y-3">
            {female.map((c) => (
              <div key={c.uid} className="relative">
                <CandidateCard candidate={c} />
                {canManage && <Button size="sm" variant="destructive" className="absolute right-3 top-3" onClick={() => remove(c.uid)}><Trash2 className="h-3 w-3" /></Button>}
              </div>
            ))}
            {female.length === 0 && <p className="text-sm text-muted-foreground">None enrolled.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function VotersTab({ electionId, election, canManage }: { electionId: string; election: ElectionDoc; canManage: boolean }) {
  const [list, setList] = useState<EligibleStudent[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setList(await listEligibleStudents(electionId));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add() {
    const parsed = addStudentSchema.safeParse({ email });
    if (!parsed.success) return;
    setBusy(true);
    await addEligibleStudent(electionId, email, "teacher");
    setEmail("");
    await load();
    setBusy(false);
  }
  async function remove(e: string) {
    await removeEligibleStudent(electionId, e);
    await load();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Eligible Students</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-md border-2 border-black bg-brand-yellowMuted p-3 text-sm">
          <Info className="h-4 w-4" /> Mode: <b>{election.eligibilityMode === "open" ? "Open (all authenticated students)" : "Restricted (only listed below)"}</b>
        </div>
        {canManage && election.eligibilityMode === "restricted" && (
          <div className="flex gap-2">
            <Input placeholder="student@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={add} disabled={busy} className="bg-black text-white">Add</Button>
          </div>
        )}
        <div className="divide-y-2 border-t-2 border-black">
          {list.map((s) => (
            <div key={s.email} className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold">{s.email}</span>
              {canManage && election.eligibilityMode === "restricted" && (
                <Button size="sm" variant="destructive" onClick={() => remove(s.email)}><Trash2 className="h-3 w-3" /></Button>
              )}
            </div>
          ))}
          {list.length === 0 && <p className="py-3 text-sm text-muted-foreground">No restricted list configured.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function AuthoritiesTab({ election, canManage, refresh }: { election: ElectionDoc; canManage: boolean; refresh: () => void }) {
  const [form, setForm] = useState({
    hodEmail: election.authority.hodEmail,
    coordinatorEmail: election.authority.coordinatorEmail,
    counsellorEmail: election.authority.counsellorEmail
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setErr(null);
    const parsed = authoritySchema.safeParse(form);
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    await setAuthority(election.id, form);
    setSaved(true);
    await refresh();
    setBusy(false);
  }

  const items = [
    { key: "hodEmail", label: "HOD", sub: "10% voting authority" },
    { key: "coordinatorEmail", label: "I Year Coordinator", sub: "10% voting authority" },
    { key: "counsellorEmail", label: "Class Counsellor", sub: "10% voting authority" }
  ] as const;

  return (
    <Card>
      <CardHeader><CardTitle>Voting Authorities</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.map((it) => (
          <div key={it.key}>
            <Label>{it.label} <span className="text-xs text-muted-foreground">({it.sub})</span></Label>
            <Input className="mt-1" value={form[it.key]} disabled={!canManage} onChange={(e) => setForm((f) => ({ ...f, [it.key]: e.target.value }))} placeholder="email@college.edu" />
          </div>
        ))}
        {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
        {saved && <p className="text-sm font-semibold text-green-700">Authorities saved. UIDs resolve when they sign in.</p>}
        {canManage && <Button className="bg-black text-white" onClick={save} disabled={busy}>Save Authorities</Button>}
      </CardContent>
    </Card>
  );
}

function ShareTab({ electionId }: { electionId: string }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/election/${electionId}`;
  const canvasRef = useRef<HTMLDivElement>(null);

  function copy() {
    navigator.clipboard.writeText(url);
  }
  function download() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `election-${electionId}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Voting Link</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="break-all rounded-md border-2 border-black bg-muted p-3 text-sm">{url}</div>
          <div className="flex gap-2">
            <Button className="bg-black text-white" onClick={copy}><Copy className="h-4 w-4" /> Copy Link</Button>
          </div>
          <p className="text-xs text-muted-foreground">Scanning this QR still requires Google sign-in and respects all eligibility & one-vote rules.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>QR Code</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div ref={canvasRef} className="rounded-md border-2 border-black bg-white p-3">
            <QRCodeCanvas value={url} size={200} level="H" />
          </div>
          <Button variant="outline" onClick={download}><Download className="h-4 w-4" /> Download PNG</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultsTab({ election, candidates, canManage, refresh }: { election: ElectionDoc; candidates: ElectionCandidate[]; canManage: boolean; refresh: () => void }) {
  const [result, setResult] = useState<ElectionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function compute() {
    setBusy(true);
    setErr(null);
    try {
      const r = await calculateResults(election, candidates);
      setResult(r);
    } catch (e) {
      setErr("Could not compute results.");
    }
    setBusy(false);
  }
  async function finalize() {
    if (!result) return;
    setBusy(true);
    await storeResult(election.id, result, true, userDoc?.uid);
    await refresh();
    setBusy(false);
  }
  useEffect(() => {
    (async () => {
      const stored = await getStoredResult(election.id);
      if (stored) setResult(stored);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = computeElectionStatus(election);
  const resultsOpen = status === "RESULTS_PUBLISHED" || status === "RESULT_PENDING";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button className="bg-black text-white" onClick={compute} disabled={busy}><BarChart3 className="h-4 w-4" /> Calculate Results</Button>
        {canManage && status !== "RESULTS_PUBLISHED" && result && (
          <Button variant="secondary" onClick={finalize} disabled={busy}><CheckCircle2 className="h-4 w-4" /> Finalize</Button>
        )}
        {!resultsOpen && <Badge className="bg-orange-200">Results locked until announcement time</Badge>}
        {election.finalized && <Badge className="bg-green-300">Finalized</Badge>}
      </div>
      {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
      {result && <ResultView result={result} />}
      {!result && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Calculate results to preview the weighted outcome.</CardContent></Card>}
    </div>
  );
}

function ResultView({ result }: { result: ElectionResult }) {
  return (
    <div className="space-y-6">
      {(["Male", "Female"] as const).map((g) => {
        const grp = result[g.toLowerCase() as "male" | "female"];
        return (
          <Card key={g}>
            <CardHeader><CardTitle>{g} Category — {grp.totalValidVotes} valid votes</CardTitle></CardHeader>
            <CardContent>
              {grp.hasTie && <div className="mb-3 flex items-center gap-2 rounded-md border-2 border-black bg-orange-100 p-2 text-sm font-bold"><Lock className="h-4 w-4" /> TIE — PENDING RESOLUTION by Counsellor & Coordinator</div>}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-black font-bold uppercase text-xs">
                      <th className="py-2">Rank</th><th>Name</th><th>Student %</th><th>Student pts</th><th>HOD</th><th>Coord</th><th>Couns</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.candidates.map((c) => (
                      <tr key={c.uid} className={`border-b border-black/10 ${c.isWinner ? "bg-brand-yellowMuted" : ""}`}>
                        <td className="py-2 font-bold">{c.rank}{c.isWinner ? " 🏆" : ""}</td>
                        <td className="font-semibold">{c.name}</td>
                        <td>{(c.studentVoteShare * 100).toFixed(1)}%</td>
                        <td>{c.studentWeightedScore.toFixed(1)}</td>
                        <td>{c.hodScore}</td>
                        <td>{c.coordinatorScore}</td>
                        <td>{c.counsellorScore}</td>
                        <td className="font-extrabold">{c.totalScore.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SettingsTab({ election, canManage, refresh }: { election: ElectionDoc; canManage: boolean; refresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    startDate: new Date(election.startTime).toISOString().slice(0, 10),
    startTime: new Date(election.startTime).toTimeString().slice(0, 5),
    endDate: new Date(election.endTime).toISOString().slice(0, 10),
    endTime: new Date(election.endTime).toTimeString().slice(0, 5),
    resultDate: new Date(election.resultTime).toISOString().slice(0, 10),
    resultTime: new Date(election.resultTime).toTimeString().slice(0, 5),
    eligibilityMode: election.eligibilityMode
  });

  async function save() {
    setBusy(true);
    await updateElectionTimes(election.id, {
      name: election.name,
      description: election.description,
      className: election.className,
      section: election.section,
      ...form,
      studentWeight: election.studentWeight,
      authorityWeightEach: election.authorityWeightEach
    } as any);
    setMsg("Saved.");
    await refresh();
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader><CardTitle>Election Settings</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">These mirror the original election configuration. Times are stored as absolute timestamps.</p>
        <div className="grid grid-cols-2 gap-3">
          <Label>Start</Label><Label>End</Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input type="date" value={form.startDate} disabled={!canManage} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input type="time" value={form.startTime} disabled={!canManage} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <Input type="date" value={form.endDate} disabled={!canManage} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <Input type="time" value={form.endTime} disabled={!canManage} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <Input type="date" value={form.resultDate} disabled={!canManage} onChange={(e) => setForm({ ...form, resultDate: e.target.value })} />
          <Input type="time" value={form.resultTime} disabled={!canManage} onChange={(e) => setForm({ ...form, resultTime: e.target.value })} />
        </div>
        <div>
          <Label>Eligibility Mode</Label>
          <Select className="mt-1" value={form.eligibilityMode} disabled={!canManage} onChange={(e) => setForm({ ...form, eligibilityMode: e.target.value as "open" | "restricted" })}>
            <option value="open">Open</option>
            <option value="restricted">Restricted</option>
          </Select>
        </div>
        {msg && <p className="text-sm font-semibold text-green-700">{msg}</p>}
        {canManage && <Button className="bg-black text-white" onClick={save} disabled={busy}>Save Settings</Button>}
      </CardContent>
    </Card>
  );
}
