"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function diff(target: number) {
  const d = Math.max(0, target - Date.now());
  const days = Math.floor(d / 86400000);
  const hours = Math.floor((d % 86400000) / 3600000);
  const minutes = Math.floor((d % 3600000) / 60000);
  const seconds = Math.floor((d % 60000) / 1000);
  return { days, hours, minutes, seconds, done: d === 0 };
}

export function Countdown({
  target,
  label,
  onComplete,
  className
}: {
  target: number;
  label?: string;
  onComplete?: () => void;
  className?: string;
}) {
  const [t, setT] = useState(() => diff(target));
  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => {
      const next = diff(target);
      setT(next);
      if (next.done && onComplete) onComplete();
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const blocks = [
    { v: t.days, l: "Days" },
    { v: t.hours, l: "Hrs" },
    { v: t.minutes, l: "Min" },
    { v: t.seconds, l: "Sec" }
  ];

  return (
    <div className={cn("", className)}>
      {label && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>}
      <div className="flex gap-2">
        {blocks.map((b) => (
          <div key={b.l} className="flex min-w-[3.5rem] flex-col items-center rounded-md border-2 border-black bg-white px-2 py-1.5 shadow-brutal-sm">
            <span className="font-heading text-2xl font-extrabold tabular-nums">{String(b.v).padStart(2, "0")}</span>
            <span className="text-[10px] font-bold uppercase">{b.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
