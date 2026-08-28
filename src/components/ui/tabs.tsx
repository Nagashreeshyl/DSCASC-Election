"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

export function Tabs({
  tabs,
  value,
  onChange,
  className
}: {
  tabs: TabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex flex-wrap gap-2 border-b-2 border-black pb-2", className)}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "rounded-md border-2 border-black px-4 py-2 text-sm font-bold transition-all",
              active
                ? "bg-brand-charcoal text-white shadow-brutal-sm"
                : "bg-white text-brand-charcoal hover:bg-brand-yellowMuted"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
