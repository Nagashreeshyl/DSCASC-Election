"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, UploadCloud, CheckCircle2, Copy, Loader2, UserCircle2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading";
import { useAuth } from "@/lib/hooks/useAuth";
import { getCandidateProfile } from "@/lib/services/userService";
import { saveCandidateProfile } from "@/lib/services/candidateService";
import { uploadCandidatePhoto } from "@/lib/services/cloudinary";
import { candidateProfileSchema, type CandidateProfileInput } from "@/lib/schemas";
import type { CandidateProfile } from "@/lib/types";
import { getElectionsByIds } from "@/lib/services/electionService";
import { formatDateShort } from "@/lib/utils";

const NAV: NavItem[] = [
  { href: "/candidate", label: "My Profile", icon: UserCircle2 }
];

export default function CandidatePage() {
  return (
    <RoleGuard allow={["candidate"]}>
      <CandidateInner />
    </RoleGuard>
  );
}

function CandidateInner() {
  const { userDoc } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ url: string; publicId: string } | null>(null);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<{ id: string; name: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CandidateProfileInput>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: { name: "", gender: "Male", promises: [""] }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "promises" as never });
  const gender = watch("gender");

  useEffect(() => {
    if (!userDoc) return;
    (async () => {
      const p = await getCandidateProfile(userDoc.uid);
      if (p) {
        setProfile(p);
        setValue("name", p.name);
        setValue("gender", p.gender);
        setValue("promises", p.promises.length ? p.promises : [""]);
        setPhotoPreview(p.photoUrl || null);
        setSavedCode(p.candidateCode || null);
        const elections = await getElectionsByIds(p.enrolledElectionIds);
        setEnrolled(elections);
      } else {
        setValue("name", userDoc.displayName || "");
      }
      setLoading(false);
    })();
  }, [userDoc, setValue]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
    setUploaded(null);
  }

  async function handleUpload() {
    if (!photoFile) return;
    setUploading(true);
    try {
      const res = await uploadCandidatePhoto(photoFile);
      setUploaded(res);
      setMessage("Photo uploaded.");
    } catch (err) {
      setMessage("Upload failed. Try a smaller image.");
    }
    setUploading(false);
  }

  async function onSubmit(data: CandidateProfileInput) {
    if (!userDoc) return;
    setBusy(true);
    setMessage(null);
    try {
      const photo = uploaded
        ? uploaded
        : photoPreview && profile?.photoUrl === photoPreview
        ? { url: profile.photoUrl, publicId: profile.cloudinaryPublicId }
        : null;
      const code = await saveCandidateProfile(userDoc.uid, data, photo, userDoc.email);
      setSavedCode(code);
      setMessage("Profile saved successfully!");
      const refreshed = await getCandidateProfile(userDoc.uid);
      if (refreshed) setProfile(refreshed);
    } catch (e) {
      setMessage("Could not save profile.");
    }
    setBusy(false);
  }

  if (loading) return <LoadingScreen label="Loading your profile…" />;

  const progress = profile?.profileCompleted ? 100 : 35;

  return (
    <DashboardShell role="candidate" nav={NAV}>
      <h1 className="mb-1 font-heading text-3xl font-extrabold tracking-tight">Candidate Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">Complete your profile to receive your unique candidate code.</p>

      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-md border-2 border-black bg-brand-yellowMuted p-3 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile form */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Photo */}
              <div>
                <Label>Candidate Photo</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border-2 border-black bg-muted">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle2 className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                      <UploadCloud className="h-4 w-4" /> Choose image
                    </Button>
                    {photoFile && !uploaded && (
                      <Button type="button" onClick={handleUpload} disabled={uploading} className="bg-black text-white">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload to Cloudinary"}
                      </Button>
                    )}
                    {uploaded && <Badge className="bg-green-300"><CheckCircle2 className="h-3 w-3" /> Uploaded</Badge>}
                  </div>
                </div>
              </div>

              <div>
                <Label>Full Name</Label>
                <Input className="mt-2" {...register("name")} />
                {errors.name && <p className="mt-1 text-xs font-semibold text-destructive">{errors.name.message}</p>}
              </div>

              <div>
                <Label>Gender</Label>
                <Select className="mt-2" {...register("gender")}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Select>
                {errors.gender && <p className="mt-1 text-xs font-semibold text-destructive">{errors.gender.message}</p>}
              </div>

              <div>
                <Label>Promises</Label>
                <div className="mt-2 space-y-2">
                  {fields.map((f, i) => (
                    <div key={f.id} className="flex gap-2">
                      <Input placeholder={`Promise ${i + 1}`} {...register(`promises.${i}` as const)} />
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(i)} disabled={fields.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append("")}>
                  <Plus className="h-4 w-4" /> Add promise
                </Button>
                {errors.promises && <p className="mt-1 text-xs font-semibold text-destructive">{errors.promises.message as string}</p>}
              </div>

              <Button type="submit" disabled={busy} className="w-full bg-black text-white">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Code + progress */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Completion</CardTitle></CardHeader>
            <CardContent>
              <div className="h-4 w-full overflow-hidden rounded-full border-2 border-black bg-muted">
                <div className="h-full bg-brand-yellow" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-sm font-semibold">{progress}% complete</p>
            </CardContent>
          </Card>

          <Card className="bg-brand-charcoal text-white">
            <CardHeader><CardTitle className="text-white">Your Candidate Code</CardTitle></CardHeader>
            <CardContent>
              {savedCode ? (
                <>
                  <div className="flex items-center justify-center rounded-md border-2 border-white bg-brand-yellow py-6">
                    <span className="font-heading text-5xl font-extrabold tracking-widest text-brand-charcoal">{savedCode}</span>
                  </div>
                  <p className="mt-3 text-center text-xs text-brand-sage">Share this code with your teacher to be enrolled.</p>
                  <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => navigator.clipboard.writeText(savedCode)}>
                    <Copy className="h-4 w-4" /> Copy code
                  </Button>
                </>
              ) : (
                <p className="text-sm text-brand-sage">Save your profile to generate a unique 5-character code.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Enrolled Elections</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {enrolled.length === 0 && <p className="text-sm text-muted-foreground">Not enrolled in any election yet.</p>}
                {enrolled.map((e) => (
                  <Link key={e.id} href={`/election/${e.id}`} className="block rounded-md border-2 border-black p-3 hover:bg-brand-yellowMuted">
                    <p className="font-bold">{e.name}</p>
                    <p className="text-xs text-muted-foreground">View & vote</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
