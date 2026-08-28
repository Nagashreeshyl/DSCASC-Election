import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center border-2 border-black bg-brand-charcoal">
        <span className="text-base font-extrabold text-brand-yellow">D</span>
      </span>
      <span className="font-heading text-lg font-extrabold tracking-tight">DSCASC</span>
    </div>
  );
}
