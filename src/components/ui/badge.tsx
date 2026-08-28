import { cn } from "@/lib/utils";

export function Badge({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-wide",
        className
      )}
    >
      {children}
    </span>
  );
}
