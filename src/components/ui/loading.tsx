"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} />;
}

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-brand-charcoal" />
      <p className="font-semibold text-brand-charcoal">{label}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border-2 border-black bg-white p-5 shadow-brutal">
      <div className="skeleton mb-3 h-6 w-2/3" />
      <div className="skeleton mb-2 h-4 w-full" />
      <div className="skeleton mb-2 h-4 w-5/6" />
      <div className="skeleton h-9 w-1/3" />
    </div>
  );
}
