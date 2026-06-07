"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SHARE_COST = 2;

type ShareState = {
  slug: string | null;
  createdAt: number | null;
};

/**
 * ShareButton — sits next to Export. Two flows:
 *  - First click on an unshared report: opens a price-clear confirm dialog
 *    that says "Publish this report? Costs 2 credits, once." On confirm,
 *    POSTs the share endpoint and reveals a copy-link panel.
 *  - Subsequent clicks: opens the same panel directly (no re-charge).
 *
 * The component never makes a charging call without an explicit user
 * confirmation, so the 2-credit deduction can't be a surprise.
 */
export function ShareButton({
  architectureId,
  initialShare,
}: {
  architectureId: string;
  initialShare?: { slug: string; createdAt: number } | null;
}) {
  const [share, setShare] = useState<ShareState>({
    slug: initialShare?.slug ?? null,
    createdAt: initialShare?.createdAt ?? null,
  });
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const url =
    share.slug != null && typeof window !== "undefined"
      ? `${window.location.origin}/r/${share.slug}`
      : "";

  useEffect(() => {
    if (!open && !confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, confirming]);

  function handleClick() {
    if (share.slug) {
      setOpen(true);
    } else {
      setConfirming(true);
    }
  }

  async function handlePublish() {
    setBusy(true);
    try {
      const res = await fetch(`/api/architect/${architectureId}/share`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        slug?: string;
        url?: string;
        charged?: number;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error || `Couldn't publish (HTTP ${res.status})`);
      }
      if (!body.slug) throw new Error("Share response missing slug");
      setShare({ slug: body.slug, createdAt: Date.now() });
      setConfirming(false);
      setOpen(true);
      if (body.charged && body.charged > 0) {
        toast.success(`Published. ${body.charged} credits used.`);
      } else {
        toast.success("Public link ready.");
      }
    } catch (err) {
      toast.error((err as Error).message || "Couldn't publish");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — long-press the link to copy manually.");
    }
  }

  async function handleRevoke() {
    if (!share.slug) return;
    const ok = window.confirm(
      "Revoke the public link? Anyone with the URL will lose access immediately. Your 2 credits are not refunded.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/architect/${architectureId}/share`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShare({ slug: null, createdAt: null });
      setOpen(false);
      toast.success("Public link revoked.");
    } catch (err) {
      toast.error((err as Error).message || "Couldn't revoke link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-2.5 text-[11.5px] rounded-full border bg-[hsl(var(--paper-2))] transition-colors",
          share.slug
            ? "border-[hsl(var(--accent))]/40 text-[hsl(var(--ink))] hover:border-[hsl(var(--accent))]"
            : "border-[hsl(var(--line-2))] hover:border-[hsl(var(--ink))]",
        )}
        title={
          share.slug
            ? "Public link is live — click to copy or revoke"
            : "Publish a public read-only link (costs 2 credits)"
        }
      >
        <span className="ms text-[14px]" aria-hidden>
          {share.slug ? "public" : "ios_share"}
        </span>
        {share.slug ? "Shared" : "Share"}
        {!share.slug && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--ink-3))]">
            · 2cr
          </span>
        )}
      </button>

      {/* CONFIRM — first publish, costs credits */}
      {confirming && (
        <Sheet onClose={() => setConfirming(false)}>
          <span className="section-num text-[10.5px]">Publish</span>
          <h2 className="display mt-3 text-[22px] leading-tight tracking-[-0.02em]">
            Mint a public link for this report?
          </h2>
          <p className="mt-3 text-[13.5px] leading-[1.55] text-[hsl(var(--ink-2))]">
            Anyone with the URL can read the report — no Tessar account needed.
            They&apos;ll see the same canvas you see now, but they can&apos;t edit,
            export, or chat with it.
          </p>

          <div className="mt-5 rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--paper-2))] p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-[hsl(var(--ink-2))]">One-time cost</span>
              <span className="font-mono text-[16px] tabular-nums text-[hsl(var(--ink))]">
                {SHARE_COST} credits
              </span>
            </div>
            <p className="mt-2 text-[11.5px] text-[hsl(var(--ink-3))] leading-relaxed">
              Charged once, no recurring fee. You can revoke the link any time —
              the 2 credits are not refunded.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-[13px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={busy}
              className={cn(
                "btn-pill press",
                busy ? "!bg-[hsl(var(--paper-3))] !text-[hsl(var(--ink-3))] !border-[hsl(var(--paper-3))] cursor-not-allowed" : "btn-pill-accent",
              )}
            >
              {busy ? (
                <>
                  <span className="ms text-[16px] animate-spin" aria-hidden>progress_activity</span>
                  Publishing
                </>
              ) : (
                <>
                  Publish · 2 credits
                  <span className="ms text-[16px]" aria-hidden>check</span>
                </>
              )}
            </button>
          </div>
        </Sheet>
      )}

      {/* SHARE PANEL — copy + revoke */}
      {open && share.slug && (
        <Sheet onClose={() => setOpen(false)}>
          <span className="section-num text-[10.5px]">Public link</span>
          <h2 className="display mt-3 text-[22px] leading-tight tracking-[-0.02em]">
            Shareable, read-only.
          </h2>
          <p className="mt-3 text-[13px] leading-[1.55] text-[hsl(var(--ink-2))]">
            Anyone with this URL can view the full report.
          </p>

          <div className="mt-5 flex items-stretch gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 min-w-0 rounded-xl border border-[hsl(var(--line-2))] bg-[hsl(var(--paper-2))] px-3 py-2 text-[13px] font-mono text-[hsl(var(--ink))] focus:outline-none focus:border-[hsl(var(--ink))]"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--paper))] px-3 text-[12.5px] font-medium transition-colors hover:bg-[hsl(var(--ink-2))]"
            >
              <span className="ms text-[16px]" aria-hidden>
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleRevoke}
              disabled={busy}
              className="text-[12.5px] text-[hsl(var(--ink-3))] hover:text-[hsl(var(--bad))] transition-colors disabled:opacity-50"
            >
              Revoke link
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[13px] text-[hsl(var(--ink-2))] hover:text-[hsl(var(--ink))] transition-colors"
            >
              Done
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

function Sheet({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[hsl(var(--ink))]/30 backdrop-blur-sm p-4 m3-rise"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-[hsl(var(--line))] bg-[hsl(var(--paper))] p-6 md:p-7 shadow-2xl shadow-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
