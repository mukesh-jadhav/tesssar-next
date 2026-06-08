import { Skeleton } from "./Skeleton";
import { cn } from "@/lib/utils";

type SkeletonDiagramProps = {
  /** Aspect ratio CSS, e.g. "16/9" or "4/3". Default "16/9". */
  aspect?: string;
  className?: string;
};

/**
 * Diagram placeholder — shows a faux network of nodes + wires inside an
 * editorial frame. Used in report cockpit while diagrams hydrate.
 */
export function SkeletonDiagram({ aspect = "16/9", className }: SkeletonDiagramProps) {
  return (
    <div
      className={cn(
        "card-paper relative w-full overflow-hidden p-6",
        className,
      )}
      style={{ aspectRatio: aspect }}
      aria-hidden
    >
      {/* Faux nodes */}
      <Skeleton className="absolute left-[10%] top-[20%] h-12 w-24 rounded-2xl" />
      <Skeleton className="absolute left-[42%] top-[12%] h-12 w-24 rounded-2xl" />
      <Skeleton className="absolute left-[74%] top-[22%] h-12 w-24 rounded-2xl" />
      <Skeleton className="absolute left-[20%] top-[60%] h-12 w-24 rounded-2xl" />
      <Skeleton className="absolute left-[55%] top-[64%] h-12 w-24 rounded-2xl" />

      {/* Faux wires */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <g stroke="hsl(var(--line-2))" strokeWidth="0.3" fill="none" strokeDasharray="0.6 0.6">
          <path d="M22,26 C30,26 36,18 50,18" />
          <path d="M62,18 C72,18 78,26 86,26" />
          <path d="M22,66 C30,66 40,66 55,68" />
          <path d="M50,26 C50,40 32,48 32,62" />
          <path d="M86,28 C86,46 70,56 67,64" />
        </g>
      </svg>
    </div>
  );
}
