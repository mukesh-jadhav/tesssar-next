"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Plus,
  History,
  CreditCard,
  Eye,
  LogIn,
  LogOut,
  ArrowRight,
  Sparkles,
  Home,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/firebase/client";

type Cmd = {
  id: string;
  label: string;
  group: "Navigate" | "Actions";
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  shortcut?: string;
  run: (router: ReturnType<typeof useRouter>) => void;
};

const COMMANDS: Cmd[] = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    group: "Navigate",
    icon: LayoutDashboard,
    keywords: "home overview",
    shortcut: "G D",
    run: (r) => r.push("/dashboard"),
  },
  {
    id: "nav-new",
    label: "New architecture",
    group: "Navigate",
    icon: Plus,
    keywords: "create generate design",
    shortcut: "G N",
    run: (r) => r.push("/new"),
  },
  {
    id: "nav-history",
    label: "History",
    group: "Navigate",
    icon: History,
    keywords: "past previous runs",
    shortcut: "G H",
    run: (r) => r.push("/history"),
  },
  {
    id: "nav-pricing",
    label: "Pricing & credits",
    group: "Navigate",
    icon: CreditCard,
    keywords: "buy purchase plans top up",
    shortcut: "G P",
    run: (r) => r.push("/pricing"),
  },
  {
    id: "nav-sample",
    label: "View sample report",
    group: "Navigate",
    icon: Eye,
    keywords: "example demo preview",
    run: (r) => r.push("/sample"),
  },
  {
    id: "nav-home",
    label: "Home (landing)",
    group: "Navigate",
    icon: Home,
    keywords: "marketing index",
    run: (r) => r.push("/"),
  },
  {
    id: "nav-terms",
    label: "Terms of service",
    group: "Navigate",
    icon: ScrollText,
    keywords: "legal",
    run: (r) => r.push("/legal/terms"),
  },
  {
    id: "act-new",
    label: "Start a new architecture run",
    group: "Actions",
    icon: Sparkles,
    keywords: "generate begin",
    run: (r) => r.push("/new"),
  },
  {
    id: "act-signout",
    label: "Sign out",
    group: "Actions",
    icon: LogOut,
    keywords: "logout exit",
    run: () => {
      signOut().then(() => (window.location.href = "/"));
    },
  },
  {
    id: "act-signin",
    label: "Sign in",
    group: "Actions",
    icon: LogIn,
    keywords: "login auth",
    run: (r) => r.push("/login"),
  },
];

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Reset state when opened
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => {
      const hay = `${c.label} ${c.keywords ?? ""} ${c.group}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const groups = React.useMemo(() => {
    const map = new Map<string, Cmd[]>();
    filtered.forEach((c) => {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const flat = filtered;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = flat[activeIdx];
      if (cmd) {
        cmd.run(router);
        setOpen(false);
      }
    }
  };

  // Keep active item in view
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-idx="${activeIdx}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  let runningIdx = -1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-foreground/10 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-[18%] z-50 w-[min(640px,92vw)] -translate-x-1/2",
            "overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
            "duration-200",
          )}
          onKeyDown={onKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">Command menu</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Quickly navigate Tessar or trigger common actions.
          </DialogPrimitive.Description>

          <div className="flex items-center gap-3 border-b px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              placeholder="Type a command or search…"
              className="flex h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              ESC
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1 scrollbar-thin">
            {flat.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No matches for &ldquo;{query}&rdquo;
              </div>
            )}
            {groups.map(([group, items]) => (
              <div key={group} className="py-1">
                <div className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {group}
                </div>
                {items.map((cmd) => {
                  runningIdx += 1;
                  const idx = runningIdx;
                  const active = idx === activeIdx;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      data-cmd-idx={idx}
                      data-active={active}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => {
                        cmd.run(router);
                        setOpen(false);
                      }}
                      className={cn(
                        "group flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors duration-150",
                        "data-[active=true]:bg-foreground/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-7 place-items-center rounded-md border bg-card text-muted-foreground transition-colors",
                          "group-data-[active=true]:border-foreground/15 group-data-[active=true]:text-foreground",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="flex-1 truncate">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="hidden font-mono text-[10px] tracking-wider text-muted-foreground sm:inline">
                          {cmd.shortcut}
                        </span>
                      )}
                      <ArrowRight
                        className={cn(
                          "size-3.5 text-muted-foreground/40 transition-all duration-200",
                          "group-data-[active=true]:translate-x-0.5 group-data-[active=true]:text-foreground",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t bg-card/40 px-4 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border bg-background px-1 font-mono">↑</kbd>
                <kbd className="rounded border bg-background px-1 font-mono">↓</kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded border bg-background px-1 font-mono">↵</kbd>
                select
              </span>
            </div>
            <span className="hidden sm:inline">Tessar · ⌘K</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Compact "Press ⌘K" button to expose the palette in the header. */
export function CommandMenuTrigger({ className }: { className?: string }) {
  const open = React.useCallback(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  }, []);
  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "group/cmd inline-flex h-9 items-center gap-2.5 rounded-md border bg-card/60 px-2.5 text-xs text-muted-foreground transition-all duration-200 ease-out-quart hover:border-foreground/15 hover:bg-card hover:text-foreground",
        className,
      )}
      aria-label="Open command menu"
    >
      <Search className="size-3.5" />
      <span className="hidden md:inline">Search or jump to…</span>
      <span className="ml-auto inline-flex items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] tracking-wider text-muted-foreground/80">
        <span>⌘</span>
        <span>K</span>
      </span>
    </button>
  );
}
