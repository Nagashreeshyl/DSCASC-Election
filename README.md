# DSCASC — Class Representative Election Platform

A production-grade, institutional online election platform for **Class Representative (CR) elections**,
built with **Next.js (App Router) + TypeScript + Tailwind + Firebase + Cloudinary**.

The first election is *I Semester BBA — Section B*, but the architecture supports **unlimited independent
elections**, each with its own candidates, authorities, votes, results and timing.

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Canvas Confetti, `qrcode.react`
- **UI:** shadcn-style primitives, Lucide icons, Neo-Brutalist landing + clean dashboards
- **Auth:** Firebase Authentication (Google only)
- **DB:** Cloud Firestore (with security rules + transactions)
- **Storage:** Cloudinary (signed uploads — secret never reaches the browser)
- **Validation:** Zod + React Hook Form
- **Dates:** `react-day-picker` calendar + time selector, timezone-aware epoch storage

---

## Project Structure

```
src/
  app/
    layout.tsx                 # root layout + AuthProvider + fonts
    page.tsx                   # Neo-Brutalist landing
    login/page.tsx             # Google sign-in
    dashboard/page.tsx         # role-aware redirect
    guidelines/page.tsx        # voting guidelines + weightage
    admin/page.tsx             # Admin dashboard (stats, teachers, users, elections)
    teacher/page.tsx           # Teacher dashboard (elections + create)
    teacher/election/[id]/page.tsx  # election mgmt (candidates, voters, authorities, QR, results, settings)
    candidate/page.tsx         # Candidate profile, Cloudinary, candidate code
    student/page.tsx           # Student election list + countdown
    election/[id]/page.tsx     # public election info + weightage + candidates
    election/[id]/vote/page.tsx# secure voting (role-aware)
    election/[id]/submitted/page.tsx # success + countdown to results
    election/[id]/results/page.tsx   # animated reveal + confetti + scores
    api/cloudinary/sign/route.ts     # server-signed Cloudinary upload
  components/
    ui/                        # button, card, input, modal, tabs, countdown, badge, loading, datetime-picker, logo
    layout/DashboardShell.tsx  # sidebar + topbar shell
    auth/RoleGuard.tsx         # protected routes
    election/CandidateCard.tsx
  lib/
    types.ts                   # all domain types
    config.ts                  # ADMIN_EMAILS, weight defaults
    utils.ts                   # status calc, formatting, code generation
    schemas.ts                 # Zod schemas
    firebase.ts                # client init (guarded)
    hooks/useAuth.tsx          # auth context (ensureUserRecord)
    services/                  # userService, electionService, voteService, resultService,
                               #   candidateService, adminService, authService, cloudinary
firebase/
  firestore.rules             # security rules (see below)
  firestore.indexes.json
.env.example                  # copy to .env.local
```

---

## 1. Environment & Install

```bash
cp .env.example .env.local     # then fill real values
npm install
npm run dev                    # http://localhost:3000
```

### `.env.local`

| Variable | Purpose | Exposure |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase web config | **Public** (required by Firebase client) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud | Public |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER` | Upload folder | Public |
| `NEXT_PUBLIC_APP_URL` | App origin (QR links) | Public |
| `CLOUDINARY_API_KEY` | Sign uploads | **Server only** |
| `CLOUDINARY_API_SECRET` | Sign uploads | **Server only — never prefix `NEXT_PUBLIC_`** |

---

## 2. Firebase Setup

1. Create a Firebase project.
2. **Authentication → Sign-in method → Google** (enable).
3. **Firestore Database → Create** (production mode).
4. Paste your web config into `.env.local`.
5. Deploy the security rules:

```bash
npm i -g firebase-tools
firebase login
firebase init firestore      # select firebase/firestore.rules + indexes
firebase deploy --only firestore
```

> The two admin emails (`powrrskanda@gmail.com`, `nagashreeshyl@gmail.com`) are enforced **in the rules file**
> (`isAdmin()`), not only in the frontend. They also receive the `admin` role automatically on first login.

---

## 3. Firestore Security Model (summary)

- **Users** create only their own doc; role claim is validated against invitation docs and admin list. Role is immutable.
- **Teachers** are invited by Admin (`teacherProfiles/{email}`); a teacher may only set their own `uid`/profile, never `active`.
- **Candidate invitations** (`candidateEmails/{email}`) are created by Admin/Teacher; the candidate sets their own `uid` on login.
- **Votes** (`elections/{id}/votes/{uid}`): a user can **only create their own vote document** while the election is `LIVE`.
  No update, no delete → **duplicate voting is impossible** even across refresh/tabs (the document already exists).
  Vote secrecy: a user can read only their own vote; managers (creator/admin) can read all for tallying.
- **Results** (`elections/{id}/result/latest`) are readable by any authenticated user but writable only by the election manager.
- **Eligible students**: each student may read **only their own** row (no collection enumeration).

---

## 4. Cloudinary Setup

1. Create a Cloudinary account → note cloud name, API key, API secret.
2. Put cloud name in `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, key/secret in the server-only vars.
3. The browser requests a **signature** from `/api/cloudinary/sign` (secret stays server-side) and uploads directly.
   No unsigned preset is required.

---

## 5. Voting & Weighted Result Logic

- **Students (70%)**: `studentVotes / totalValidVotesInGender × 70`.
- **Each authority (HOD / Coordinator / Counsellor) = 10%**: if they select a candidate, that candidate gets +10 in that gender.
- **Final = student weighted + HOD + Coordinator + Counsellor** (max 100).
- Male and Female categories are scored **independently**; candidate votes count in the opposite-gender pool.
- Top 2 per gender win. Equal scores at the cutoff → **`TIE – PENDING RESOLUTION`** (never randomly broken).
- Results are calculated in `resultService.calculateResults` and stored to `result/latest` on finalize.

### Candidate voting restriction
A Male candidate can vote **only** for one Female candidate; a Female candidate only for one Male candidate.
Enforced in `voteService.submitVote` (validation) **and** in the Firestore `create` rule.

---

## 6. Deploy to Vercel

```bash
vercel                         # import repo
# Add the same env vars in Project → Settings → Environment Variables
vercel --prod
```

Ensure `NEXT_PUBLIC_*` are added as plain values and `CLOUDINARY_API_SECRET` as a **Secret** (never exposed).

---

## 7. Testing Checklist

- [ ] Google login works; role auto-assigned (admin/teacher/candidate/student).
- [ ] Admin emails get Admin dashboard; teacher/student/candidate cannot reach it (RoleGuard + rules).
- [ ] Teacher creates election with calendar + time picker; status auto-computes.
- [ ] Teacher adds candidate email → candidate signs in → completes profile → gets **unique 5-char code**.
- [ ] Teacher enrolls candidate by code → appears in correct gender category.
- [ ] Teacher assigns HOD/Coordinator/Counsellor by email.
- [ ] QR code + link open the election; still require Google sign-in.
- [ ] Student votes 1 Male + 1 Female; submit disabled until both selected; confirmation modal.
- [ ] Male candidate can only pick a Female; Female candidate only a Male.
- [ ] Authority votes once, both categories, weight 10% each.
- [ ] **Double voting** blocked (refresh, second tab, repeated clicks) — one immutable doc.
- [ ] Restricted eligibility blocks non-listed students; open mode allows all.
- [ ] Countdown transitions: Upcoming → Live → Closed → Results.
- [ ] Results reveal with confetti; tie shows pending resolution.
- [ ] Vote secrecy: no user can read another's individual vote.

---

## Security Notes / Production Hardening

- For maximum integrity, move `calculateResults` into a **Cloud Function** (or Firebase Admin scheduled function) that
  publishes `result/latest` exactly at `resultTime`. The client can still preview, but the canonical publish is server-driven.
- Admin role is additionally enforceable via Firebase **custom claims** set with the Admin SDK for defense-in-depth.
- All secrets remain server-side; no Admin SDK key is shipped to the browser.
