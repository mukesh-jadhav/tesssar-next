import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div
      className={cn(
        "group/logo flex items-center gap-2.5 font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark className="size-[22px] text-foreground transition-transform duration-500 ease-out-quart group-hover/logo:rotate-[-6deg]" />
      {showWordmark && <span className="text-[15px] leading-none">Tessar</span>}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Outer arch — the system boundary */}
      <path
        d="M2 22V12a10 10 0 0 1 20 0v10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Mid arch */}
      <path
        d="M6 22v-6a6 6 0 0 1 12 0v6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Core dot — the seed */}
      <circle cx="12" cy="22" r="1.6" fill="currentColor" />
    </svg>
  );
}
