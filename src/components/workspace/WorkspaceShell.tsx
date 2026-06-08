"use client";

/**
 * WorkspaceShell — single-screen cockpit chrome.
 *
 *  - Viewport is locked (html/body never scroll).
 *  - No left rail, no header. Children render their own navigation.
 *  - `grain` is opt-in (Phase 9.4): paper grain is kept on marketing-leaning
 *    surfaces (`/sample`) and off everywhere data-dense (`/dashboard`,
 *    `/new`, `/history`, `/architecture/*`, `/studio`).
 *  - `user` and `credits` are retained for backwards-compatible call
 *    sites but are intentionally unused here.
 */

type RailUser = {
  displayName: string | null;
  email: string;
  photoURL: string | null;
} | null;

export function WorkspaceShell({
  user: _user,
  credits: _credits,
  grain = false,
  children,
}: {
  user: RailUser;
  credits?: number;
  grain?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${grain ? "grain " : ""}shell-locked flex-1 min-h-0 w-full flex flex-col bg-[hsl(var(--paper))] text-[hsl(var(--ink))]`}
    >
      <main className="flex-1 min-h-0 w-full min-w-0 flex flex-col bg-[hsl(var(--paper-2))]">
        {children}
      </main>
    </div>
  );
}