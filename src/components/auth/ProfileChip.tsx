"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/firebase/client";
import { toast } from "sonner";

export type ProfileChipUser = {
  displayName: string | null;
  email: string;
  photoURL: string | null;
};

export function ProfileChip({
  user,
  credits,
}: {
  user: ProfileChipUser;
  credits?: number;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
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

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out.");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Sign-out failed");
    } finally {
      setSigningOut(false);
    }
  }

  const initial =
    (user.displayName?.trim()[0] ?? user.email?.trim()[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group inline-flex items-center gap-2 rounded-full border border-[hsl(var(--line))] bg-[hsl(var(--card))]/80 backdrop-blur px-1.5 py-1 pr-3 hover:border-[hsl(var(--line-2))] transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            width={28}
            height={28}
            referrerPolicy="no-referrer"
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-[hsl(var(--ink))] text-[hsl(var(--paper))] text-[12px] font-semibold">
            {initial}
          </span>
        )}
        <span className="hidden sm:inline text-[12.5px] font-medium text-[hsl(var(--ink-2))] group-hover:text-[hsl(var(--ink))] max-w-[140px] truncate">
          {user.displayName || user.email.split("@")[0]}
        </span>
        <span className="ms text-[16px] text-[hsl(var(--ink-3))] group-hover:text-[hsl(var(--ink))]" aria-hidden>
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] rounded-2xl border border-[hsl(var(--line))] bg-[hsl(var(--card))] shadow-xl shadow-black/5 overflow-hidden m3-rise"
        >
          <div className="flex items-center gap-3 p-4 border-b border-[hsl(var(--line))]">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                width={40}
                height={40}
                referrerPolicy="no-referrer"
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-10 place-items-center rounded-full bg-[hsl(var(--ink))] text-[hsl(var(--paper))] text-[14px] font-semibold">
                {initial}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-[hsl(var(--ink))] truncate">
                {user.displayName || "Signed in"}
              </div>
              <div className="text-[12px] text-[hsl(var(--ink-3))] truncate">{user.email}</div>
            </div>
          </div>

          {typeof credits === "number" && (
            <div className="flex items-baseline justify-between px-4 py-3 border-b border-[hsl(var(--line))]">
              <span className="eyebrow">Balance</span>
              <span className="display tabular-nums text-[18px] tracking-[-0.02em]">
                {credits} <span className="eyebrow">credits</span>
              </span>
            </div>
          )}

          <ul className="py-1.5 text-[13px]">
            <MenuLink href="/dashboard" icon="dashboard" label="Dashboard" onClick={() => setOpen(false)} />
            <MenuLink href="/history" icon="history" label="History" onClick={() => setOpen(false)} />
            <MenuLink href="/pricing" icon="payments" label="Pricing & credits" onClick={() => setOpen(false)} />
          </ul>

          <div className="border-t border-[hsl(var(--line))] py-1.5">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-2))] hover:text-[hsl(var(--bad))] transition-colors disabled:opacity-60"
              role="menuitem"
            >
              <span className="ms text-[18px]" aria-hidden>
                {signingOut ? "progress_activity" : "logout"}
              </span>
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center gap-2.5 px-4 py-2.5 text-[hsl(var(--ink-2))] hover:bg-[hsl(var(--paper-2))] hover:text-[hsl(var(--ink))] transition-colors"
        role="menuitem"
      >
        <span className="ms text-[18px] text-[hsl(var(--ink-3))]" aria-hidden>{icon}</span>
        {label}
      </Link>
    </li>
  );
}
