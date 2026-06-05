"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Editorial route-change rule: 2px accent line scrubbing across the viewport.
// Always rendered (opacity toggled) to avoid mount/unmount reconciliation
// collisions with sibling portals (sonner toaster, radix dialogs).
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const t = window.setTimeout(() => setActive(false), 700);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden"
      style={{ opacity: active ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-[hsl(var(--accent))]"
        style={{
          width: active ? "100%" : "0%",
          transition: active ? "width 650ms cubic-bezier(.2,.7,.2,1)" : "none",
        }}
      />
    </div>
  );
}
