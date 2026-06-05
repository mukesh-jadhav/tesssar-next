"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Material 3 Expressive page-enter spring.
 * Re-keys on pathname so the M3 expressive spatial spring re-runs on every
 * route change. Wrap children in this once per route layout to get the
 * springed slide+scale entrance.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const [k, setK] = useState(0);
  useEffect(() => {
    setK((n) => n + 1);
  }, [pathname]);

  return (
    <div key={k} className={`m3-page-enter ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}
