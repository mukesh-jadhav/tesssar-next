"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signInWithGoogle } from "@/lib/firebase/client";
import { trackSignUp } from "@/lib/analytics/track";
import { ProfileChip, type ProfileChipUser } from "@/components/auth/ProfileChip";

/**
 * HeaderAuth — client-side auth surface for the app-wide header.
 *
 *  - Signed-out: a button that triggers the Google popup directly
 *    (no /login round-trip). On success we do a full reload so the
 *    server layout re-renders with the new session cookie.
 *  - Signed-in: the ProfileChip dropdown.
 */
export function HeaderAuth({
  user,
  credits,
}: {
  user: ProfileChipUser | null;
  credits?: number;
}) {
  const [loading, setLoading] = useState(false);

  if (user) return <ProfileChip user={user} credits={credits} />;

  async function handleSignIn() {
    if (loading) return;
    setLoading(true);
    try {
      const { isNewUser } = await signInWithGoogle();
      if (isNewUser) trackSignUp();
      // Full reload — guarantees the server layout re-renders with the
      // new __tessar_session cookie. router.refresh() races with the
      // RSC cache in production and sometimes returns the cached (null)
      // user.
      window.location.reload();
    } catch (err) {
      const msg = (err as Error).message || "Sign-in failed";
      if (!/popup-closed|cancelled/i.test(msg)) toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className="btn-pill btn-pill-sm disabled:opacity-60"
    >
      {loading ? (
        <>
          <span className="ms text-[16px] animate-spin" aria-hidden>progress_activity</span>
          Signing in
        </>
      ) : (
        <>
          Sign in
          <span className="ms text-[16px]" aria-hidden>arrow_outward</span>
        </>
      )}
    </button>
  );
}
