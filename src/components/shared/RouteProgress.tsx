"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Material 3 Expressive route-change indicator.
 * Shows a thin, animated linear bar at the top of the viewport whenever
 * the pathname changes, then fades out.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 700);
    return () => window.clearTimeout(t);
  }, [pathname]);

  if (!visible) return null;
  return <div aria-hidden className="m3-route-bar" />;
}
