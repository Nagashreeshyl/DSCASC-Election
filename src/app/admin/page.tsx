"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users as UsersIcon,
  GraduationCap,
  UserCheck,
  CalendarDays,
  Radio,
  Plus,
  Trash2,
  Power,
  ShieldAlert
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen, SkeletonCard } from "@/components/ui/loading";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getAdminStats,
  listTeachers,
  listUsers,
  listCandidates,
  addTeacher,
  removeTeacher,
  setTeacherActive,
  type AdminStats
} from "@/lib/services/adminService";
import { listElections } from "@/lib/services/electionService";
import type { TeacherProfile, UserDoc, CandidateProfile, ElectionDoc } from "@/lib/types";
import { computeElectionStatus, STATUS_COLORS, STATUS_LABELS, formatDateShort } from "@/lib/utils";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: Radio },
  { href: "/admin", label: "Teachers", icon: GraduationCap },
  { href: "/admin", label: "Users", icon: UsersIcon },
  { href: "/admin", label: "Elections", icon: CalendarDays }
];

function StatCard({ icon: I, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 items-center justify-center border-2 border-black bg-brand-sage">
          <I className="h-6 w-6" />
        </div>
        <div>
          <p className="text-3xl font-extrabold">{value}</p>
          <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminInner() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [elections, setElections] = useState<ElectionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeacher, setNewTeacher] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [s, t, u, c, e] = await Promise.all([
      getAdminStats(),
      listTeachers(),
      listUsers(),
      listCandidates(),
      listElections()
    ]);
    setStats(s);
    setTeachers(t);
    setUsers(u);
    setCandidates(c);
    setElections(e);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddTeacher() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newTeacher)) {
      setMsg("Enter a valid email address.");
      return;
    }
    setBusy(true);
    await addTeacher(newTeacher);
    setNewTeacher("");
    setMsg("Teacher added. They can sign in once invited.");
    await loadAll();
    setBusy(false);
  }

  async function handleRemove(email: string) {
    if (!window.confirm(`Remove teacher ${email}?`)) return;
    await removeTeacher(email);
    await loadAll();
  }

  async function handleToggle(t: TeacherProfile) {
    await setTeacherActive(t.email, !t.active);
    await loadAll();
  }

  return (
    <DashboardShell role="admin" nav={NAV}>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform-wide oversight and role management.</p>
      </div>

      <Tabs
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "teachers", label: "Teachers" },
          { value: "users", label: "Users" },
          { value: "elections", label: "Elections" }
        ]}
        value={tab}
        onChange={setTab}
      />

      {msg && <div className="mt-4 rounded-md border-2 border-black bg-brand-yellowMuted p-3 text-sm font-semibold">{msg}</div>}

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : tab === "overview" && stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={UsersIcon} label="Total Users" value={stats.totalUsers} />
            <StatCard icon={GraduationCap} label="Teachers" value={stats.totalTeachers} />
            <StatCard icon={UserCheck} label="Candidates" value={stats.totalCandidates} />
            <StatCard icon={CalendarDays} label="Elections" value={stats.totalElections} />
            <StatCard icon={Radio} label="Live Now" value={stats.activeElections} />
          </div>
        ) : tab === "teachers" ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Add Teacher</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="teacher@college.edu" value={newTeacher} onChange={(e) => setNewTeacher(e.target.value)} />
                <Button onClick={handleAddTeacher} disabled={busy} className="w-full bg-black text-white">
                  <Plus className="h-4 w-4" /> Add Teacher
                </Button>
                <p className="text-xs text-muted-foreground">The teacher gains access only after signing in with this Google email.</p>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Teachers ({teachers.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y-2 border-t-2 border-black">
                  {teachers.map((t) => (
                    <div key={t.email} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-bold">{t.displayName}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={t.active ? "bg-green-300" : "bg-red-200"}>{t.active ? "Active" : "Disabled"}</Badge>
                        <Button size="sm" variant="outline" onClick={() => handleToggle(t)}>
                          <Power className="h-4 w-4" /> {t.active ? "Disable" : "Enable"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRemove(t.email)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {teachers.length === 0 && <p className="py-4 text-sm text-muted-foreground">No teachers yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : tab === "users" ? (
          <Card>
            <CardHeader><CardTitle>All Users ({users.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-black font-bold uppercase">
                      <th className="py-2">Name</th><th>Email</th><th>Role</th><th>Candidates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid} className="border-b border-black/20">
                        <td className="py-2 font-semibold">{u.displayName}</td>
                        <td>{u.email}</td>
                        <td><Badge className="bg-brand-sage">{u.role}</Badge></td>
                        <td>{candidates.filter((c) => c.email === u.email).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Elections ({elections.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y-2 border-t-2 border-black">
                {elections.map((e) => {
                  const status = computeElectionStatus(e);
                  return (
                    <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-bold">{e.name}</p>
                        <p className="text-xs text-muted-foreground">{e.className} — Section {e.section}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
                        <Link href={`/election/${e.id}/results`}>
                          <Button size="sm" variant="outline">Results</Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {elections.length === 0 && <p className="py-4 text-sm text-muted-foreground">No elections created.</p>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <AdminInner />
    </RoleGuard>
  );
}
