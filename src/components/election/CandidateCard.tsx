import { Badge } from "@/components/ui/badge";
import type { ElectionCandidate } from "@/lib/types";

export function CandidateCard({
  candidate,
  selected,
  onSelect,
  disabled,
  rightSlot
}: {
  candidate: ElectionCandidate;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border-2 border-black bg-white p-4 shadow-brutal transition-all ${
        selected ? "ring-4 ring-brand-yellow" : ""
      } ${onSelect && !disabled ? "cursor-pointer hover:-translate-y-1" : ""}`}
      onClick={onSelect && !disabled ? onSelect : undefined}
      role={onSelect ? "button" : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 border-black bg-muted">
          {candidate.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={candidate.photoUrl} alt={candidate.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg font-extrabold">{candidate.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge className={candidate.gender === "Male" ? "bg-brand-sage" : "bg-pink-200"}>{candidate.gender}</Badge>
            <span className="font-mono text-xs font-bold">{candidate.candidateCode}</span>
          </div>
        </div>
        {rightSlot}
      </div>
      <ul className="mt-3 space-y-1">
        {candidate.promises.slice(0, 3).map((p, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="font-bold">•</span>
            <span className="line-clamp-2">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
