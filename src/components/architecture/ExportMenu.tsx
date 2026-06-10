"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Format = "pdf" | "md" | "pptx";

const ITEMS: { f: Format; icon: string; label: string; hint: string }[] = [
  { f: "pdf",  icon: "picture_as_pdf", label: "PDF",       hint: "Editorial report · A4" },
  { f: "pptx", icon: "slideshow",      label: "PowerPoint",hint: "Widescreen 16:9 deck" },
  { f: "md",   icon: "code",           label: "Markdown",  hint: "Mermaid + tables · GitHub-ready" },
];

/**
 * ExportMenu — dropdown that downloads the report in PDF / PPTX / Markdown.
 * Compact button by default; pass `size="lg"` for the chapter-bar variant.
 */
export function ExportMenu({
  architectureId,
  size = "sm",
  className,
}: {
  architectureId: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Format | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function download(f: Format) {
    setBusy(f);
    try {
      // Force a real navigation so the browser handles the file dialog.
      window.location.href = `/api/architect/${architectureId}/export/${f}`;
      // Browser will keep the page; close the menu after a moment.
      setTimeout(() => {
        setOpen(false);
        setBusy(null);
      }, 600);
    } catch {
      setBusy(null);
    }
  }

  const btnBase =
    size === "md"
      ? "h-9 px-3 text-[12.5px]"
      : "h-7 px-2.5 text-[11.5px]";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] hover:border-[hsl(var(--ink))] transition-colors",
          btnBase,
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="ms text-[14px]" aria-hidden>file_download</span>
        Export
        <span className="ms text-[14px]" aria-hidden>{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[260px] rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--card))] shadow-xl shadow-black/5 overflow-hidden m3-rise"
        >
          <div className="px-3 pt-3 pb-2 border-b border-[hsl(var(--line))]">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-3))]">
              Export
            </span>
          </div>
          <ul className="py-1.5 text-[13px]">
            {ITEMS.map((it) => (
              <li key={it.f}>
                <button
                  type="button"
                  onClick={() => download(it.f)}
                  disabled={busy !== null}
                  className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-[hsl(var(--paper-2))] transition-colors disabled:opacity-60"
                  role="menuitem"
                >
                  <span
                    className={cn(
                      "ms text-[20px] mt-0.5",
                      busy === it.f ? "animate-spin text-[hsl(var(--accent))]" : "text-[hsl(var(--ink))]",
                    )}
                    aria-hidden
                  >
                    {busy === it.f ? "progress_activity" : it.icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[13px] font-medium text-[hsl(var(--ink))]">
                      {it.label}
                    </span>
                    <span className="text-[11.5px] text-[hsl(var(--ink-3))]">{it.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-[hsl(var(--line))] px-3 py-2 text-[10.5px] text-[hsl(var(--ink-3))]">
            Saved with the brief, components, costs &amp; risks.
          </div>
        </div>
      )}
    </div>
  );
}
