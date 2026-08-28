import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const GUIDELINES = [
  "Four Class Representatives (CRs) will be selected — 2 Male and 2 Female CRs.",
  "Only students eligible for the election may participate according to election eligibility settings.",
  "Each eligible student must vote according to the applicable voting rules.",
  "All eligible students, including CR candidates, are allowed to vote.",
  "Candidate voting restrictions are based on their gender category and election configuration.",
  "Students are requested to carefully review the CR Candidate Profiles before voting.",
  "Voting should be based on Responsibility, Communication Skills, Leadership, Fairness, Approachability, and Commitment.",
  "Please do not vote solely on the basis of friendship or popularity.",
  "Each student must submit the voting form only once.",
  "The final selection will be based on the overall weighted score out of 100%.",
  "The top 2 Male and top 2 Female candidates, based on the final weighted score, will be selected as CRs.",
  "In case of a tie, the matter will be resolved by the Class Counsellor and Class Coordinator through a fair and transparent process.",
  "The decision regarding the final selection will be considered final after verification of the results."
];

const WEIGHTS = [
  { label: "I Semester BBA – Section B Students", pct: 70 },
  { label: "Prof. Rekha M. P., HOD – BBA", pct: 10 },
  { label: "Dr. Sudarshan S. Savanoor, I Year BBA Coordinator", pct: 10 },
  { label: "Dr. Purobi Avinash, Class Counsellor – I Semester BBA, Section B", pct: 10 }
];

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="h-20 border-b-2 border-black bg-brand-yellow">
        <div className="container flex h-full items-center justify-between">
          <Logo />
          <Link href="/login"><Button size="sm" className="bg-black text-white">Sign in</Button></Link>
        </div>
      </header>

      <section className="container max-w-3xl py-12">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">Class Representative (CR) Election — Voting Guidelines</h1>
        <p className="mt-2 font-semibold text-muted-foreground">I Semester BBA — Section B</p>

        <ol className="mt-8 space-y-3">
          {GUIDELINES.map((g, i) => (
            <li key={i} className="flex gap-3 rounded-md border-2 border-black bg-white p-4 shadow-brutal-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-black bg-brand-yellow font-bold">{i + 1}</span>
              <span className="text-sm font-medium">{g}</span>
            </li>
          ))}
        </ol>

        <h2 className="mt-12 font-heading text-3xl font-extrabold tracking-tight">Weightage — 100% Voting Authority</h2>
        <Card className="mt-4 border-2 border-black shadow-brutal">
          <div className="divide-y-2 border-t-2 border-black">
            {WEIGHTS.map((w) => (
              <div key={w.label} className="flex items-center justify-between p-4">
                <span className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-green-600" />{w.label}</span>
                <span className="font-heading text-xl font-extrabold">{w.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
        <p className="mt-4 rounded-md border-2 border-black bg-brand-yellowMuted p-4 text-sm font-semibold">
          Please vote thoughtfully and choose the candidates whom you believe can genuinely represent, support and coordinate I Semester BBA — Section B.
        </p>

        <div className="mt-8">
          <Link href="/login"><Button size="lg" className="bg-black text-white">Proceed to Sign in</Button></Link>
        </div>
      </section>
    </main>
  );
}
