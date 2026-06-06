"use client";

/**
 * WorkspaceShell — single-screen cockpit chrome.
 *
 *  - Viewport is locked (html/body never scroll).
 *  - No left rail, no header. Children render their own navigation.
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
  children,
}: {
  user: RailUser;
  credits?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="grain h-full w-full bg-[hsl(var(--paper))] text-[hsl(var(--ink))]">
      <main className="h-full w-full min-w-0 min-h-0 flex flex-col bg-[hsl(var(--paper-2))]">
        {children}
      </main>
    </div>
  );
}