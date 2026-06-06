import { cn } from "@/lib/utils";

/**
 * TessarLogo — the four-plate mark.
 *
 * Named for the Tessar lens (four optical elements), the mark is four
 * graduated plates stacked at the same hinge point. The negative space
 * resolves into a "T" shape when read top-to-bottom.
 *
 * Two variants:
 *   - "mark" (default): square mark only. Use in tight chrome.
 *   - "wordmark": mark + Tessar wordmark, baseline-aligned.
 */
export function TessarLogo({
  variant = "mark",
  size = 32,
  className,
  accent,
}: {
  variant?: "mark" | "wordmark";
  size?: number;
  className?: string;
  /** Override the mark's ink colour (defaults to currentColor). */
  accent?: string;
}) {
  const stroke = accent ?? "currentColor";
  const id = `tessar-${variant}-${size}`;

  const mark = (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label="Tessar"
      className={cn("shrink-0", className)}
    >
      <title>Tessar</title>
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="1" />
          <stop offset="1" stopColor={stroke} stopOpacity="0.78" />
        </linearGradient>
      </defs>
      {/* Four stacked plates, hinged top-left, tapering down-right. */}
      {/* Plate 4 (back) */}
      <rect x="4" y="4" width="26" height="26" rx="2.5" fill={stroke} opacity="0.18" />
      {/* Plate 3 */}
      <rect x="7" y="7" width="26" height="26" rx="2.5" fill={stroke} opacity="0.34" />
      {/* Plate 2 */}
      <rect x="10" y="10" width="26" height="26" rx="2.5" fill={stroke} opacity="0.58" />
      {/* Plate 1 (front) — the readable face */}
      <rect x="13" y="13" width="23" height="23" rx="2.5" fill={`url(#${id}-shade)`} />
      {/* Aperture slit — a thin gap that reads as a "T" cross-bar. */}
      <rect x="17" y="19.5" width="15" height="1.6" rx="0.8" fill="#fff" opacity="0.9" />
      <rect x="23.7" y="20.6" width="1.6" height="11.5" rx="0.8" fill="#fff" opacity="0.9" />
    </svg>
  );

  if (variant === "mark") return mark;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {mark}
      <span
        className="display tracking-[-0.025em] leading-none"
        style={{ fontSize: Math.round(size * 0.62) }}
      >
        Tessar
      </span>
    </span>
  );
}
