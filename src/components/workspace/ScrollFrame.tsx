import { cn } from "@/lib/utils";

/**
 * ScrollFrame — fills the shell's main slot and scrolls content
 * internally. Use this around any page-level content that doesn't
 * manage its own bounded layout (i.e. anything that isn't the
 * ReportCockpit / HomeCockpit). The outer page never scrolls.
 */
export function ScrollFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 min-h-0 overflow-auto scrollbar-thin", className)}>
      {children}
    </div>
  );
}
