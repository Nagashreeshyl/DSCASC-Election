import Link from "next/link";
import { Vote, ShieldCheck, QrCode, BarChart3, Lock, Clock, Users, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const dotPattern: React.CSSProperties = {
  backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.10) 2px, transparent 2px)",
  backgroundSize: "32px 32px"
};

const brands = ["DSCASC", "BBA", "SECTION B", "HOD", "COORDINATOR", "COUNSELLOR", "CR 2025", "STUDENT COUNCIL"];

const features = [
  { icon: ShieldCheck, title: "One Vote. Enforced.", body: "Firebase Auth + Firestore transactions guarantee a single immutable vote per user, per election." },
  { icon: Lock, title: "Secret Ballot", body: "Individual votes are never readable by other users. Only aggregate results are revealed." },
  { icon: QrCode, title: "QR Voting Links", body: "Teachers generate a shareable voting link and QR code — authentication is never bypassed." },
  { icon: BarChart3, title: "Weighted Results", body: "70% students, 10% each authority. Final scores computed transparently and reproducibly." },
  { icon: Clock, title: "Live Countdowns", body: "Automatic status transitions: Upcoming → Live → Closed → Results Published." },
  { icon: Users, title: "Role Aware", body: "Admin, Teacher, Candidate and Student each get a dedicated, secure dashboard." }
];

const steps = [
  { n: "01", title: "Teacher Creates Election", body: "Set class, timing, eligibility and authority weights.", color: "border-brand-sage" },
  { n: "02", title: "Candidates Enroll", body: "Candidates share their 5-char code; teachers enroll them.", color: "border-brand-yellow" },
  { n: "03", title: "Students Vote", body: "Authenticated voting with one-tap confirmation and confetti reveal.", color: "border-white" }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* NAV */}
      <header className="fixed left-0 right-0 top-0 z-40 h-20 border-b-2 border-black bg-brand-yellow">
        <div className="container flex h-full items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-6 font-bold md:flex">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#how" className="hover:underline">How it works</a>
            <a href="/guidelines" className="hover:underline">Guidelines</a>
          </nav>
          <Link href="/login">
            <Button size="sm" className="bg-black text-white">Sign in</Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        className="border-b-2 border-black bg-brand-yellow pt-28"
        style={dotPattern}
      >
        <div className="container grid items-center gap-10 py-16 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border-2 border-black bg-white px-4 py-1 text-xs font-bold uppercase">
              New · Secure CR Elections
            </span>
            <h1 className="mt-5 font-heading text-5xl font-extrabold tracking-tighter lg:text-7xl">
              Class Rep <span className="text-transparent" style={{ WebkitTextStroke: "2px black" }}>Elections</span>, Done Right.
            </h1>
            <p className="mt-5 max-w-md text-lg font-medium">
              A transparent, weighted, tamper-resistant voting platform for I Semester BBA — Section B and every election after it.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-black text-white shadow-brutal-lg">Start Voting</Button>
              </Link>
              <Link href="/guidelines">
                <Button size="lg" variant="outline">Read Guidelines</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-xl border-2 border-black bg-white p-4 shadow-brutal-xl">
            <div className="flex items-center gap-2 border-b-2 border-black bg-black px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="rounded-md border-2 border-black bg-brand-sage p-4">
                <p className="text-xs font-bold uppercase">Live</p>
                <p className="font-heading text-2xl font-extrabold">CR Election</p>
              </div>
              <div className="rounded-md border-2 border-black bg-brand-charcoal p-4 text-white">
                <p className="text-xs font-bold uppercase text-brand-yellow">Votes</p>
                <p className="font-heading text-2xl font-extrabold">1,284</p>
              </div>
              <div className="col-span-2 rounded-md border-2 border-black bg-brand-yellow p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Top Male CR</span>
                  <span className="font-heading text-xl font-extrabold">92.4%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-b-2 border-black bg-brand-charcoal py-4">
        <div className="flex overflow-hidden">
          <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10 font-heading text-2xl font-bold text-brand-sage/50">
            {[...brands, ...brands].map((b, i) => (
              <span key={i}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b-2 border-black bg-brand-yellow py-16">
        <div className="container">
          <h2 className="font-heading text-4xl font-extrabold tracking-tight">Built for integrity</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border-2 border-black bg-white p-6 shadow-brutal">
                <div className="mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-brand-sage transition-colors group-hover:bg-brand-yellow">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-xl font-extrabold">{f.title}</h3>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-b-2 border-black bg-brand-charcoal py-16 text-white">
        <div className="container">
          <h2 className="font-heading text-4xl font-extrabold tracking-tight text-brand-yellow">How it works</h2>
          <div className="relative mt-12 grid gap-8 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-6 hidden h-1 bg-[#272727] md:block" />
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${s.color} bg-brand-charcoal font-heading text-3xl font-extrabold`}>
                  {s.n}
                </div>
                <h3 className="mt-5 font-heading text-xl font-extrabold">{s.title}</h3>
                <p className="mt-2 text-sm text-brand-sage">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section className="border-b-2 border-black bg-white py-16">
        <div className="container grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border-2 border-black bg-brand-sage p-6">
            <span className="inline-block rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase">Teacher</span>
            <p className="mt-4 font-heading text-lg font-extrabold">Create & manage elections, enroll candidates, assign authorities.</p>
          </div>
          <div className="rounded-lg border-2 border-black bg-brand-yellow p-6 shadow-brutal-lg">
            <span className="inline-block rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase">Candidate</span>
            <p className="mt-4 font-heading text-lg font-extrabold">Build a profile, get your code, track enrollment & vote.</p>
          </div>
          <div className="rounded-lg border-2 border-black bg-[#272727] p-6 text-white">
            <span className="inline-block rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold uppercase">Student</span>
            <p className="mt-4 font-heading text-lg font-extrabold">Review profiles and cast one secure, weighted vote.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand-yellow py-20" style={dotPattern}>
        <div className="container text-center">
          <h2 className="font-heading text-5xl font-extrabold tracking-tighter">Ready to run your election?</h2>
          <p className="mx-auto mt-4 max-w-lg font-medium">Join the platform built for fairness, transparency and trust.</p>
          <Link href="/login" className="mt-8 inline-block">
            <Button size="lg" className="bg-black text-white shadow-brutal-lg">Sign in with Google</Button>
          </Link>
        </div>
      </section>

      <footer className="bg-brand-charcoal py-12 text-white">
        <div className="container grid gap-8 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-brand-sage">Secure institutional elections.</p>
          </div>
          <div>
            <p className="font-bold">Platform</p>
            <ul className="mt-2 space-y-1 text-sm text-brand-sage">
              <li><Link href="/login" className="hover:text-white">Login</Link></li>
              <li><Link href="/guidelines" className="hover:text-white">Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold">Roles</p>
            <ul className="mt-2 space-y-1 text-sm text-brand-sage">
              <li>Admin</li><li>Teacher</li><li>Candidate</li><li>Student</li>
            </ul>
          </div>
          <div>
            <p className="font-bold">Security</p>
            <p className="mt-2 text-sm text-brand-sage">Firebase Auth · Firestore rules · Signed uploads.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
