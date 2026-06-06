"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signInWithGoogle } from "@/lib/firebase/client";
import { ProfileChip, type ProfileChipUser } from "@/components/auth/ProfileChip";

/**
 * HeaderAuth — client-side auth surface for the app-wide header.
 *
 *  - Signed-out: a button that triggers the Google popup directly
 *    (no /login round-trip). On success we refresh so the server
 *    layout re-renders with the new session cookie.
 *  - Signed-in: the ProfileChip dropdown.
 */
export function HeaderAuth({
  user,
  credits,
}: {
  user: ProfileChipUser | null;
  credits?: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (user) return <ProfileChip user={user} credits={credits} />;

  async function handleSignIn() {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in. Welcome to Tessar.");
      router.refresh();
    } catch (err) {
      const msg = (err as Error).message || "Sign-in failed";
      if (!/popup-closed|cancelled/i.test(msg)) toast.error(msg);
    } finally {
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
