import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor" />
        <rect x="18" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="2" y="18" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
        <rect x="18" y="18" width="12" height="12" rx="2" fill="currentColor" />
      </svg>
      <span className="text-base">Tessar</span>
    </div>
  );
}
