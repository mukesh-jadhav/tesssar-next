"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/firebase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function GoogleSignInButton({ next = "/studio" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in. Welcome to Tessar.");
      router.push(next);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "btn-pill btn-pill-lg w-full",
        loading && "opacity-60",
      )}
    >
      {loading ? (
        <span className="ms text-[22px] animate-spin" aria-hidden>progress_activity</span>
      ) : (
        <span className="grid size-7 place-items-center rounded-full bg-white">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-2.9-.4-4.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.1 8.1 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 45.5c5.4 0 10.3-2.1 14-5.4l-6.5-5.4c-2 1.4-4.6 2.3-7.5 2.3-5.2 0-9.6-3.3-11.3-8l-6.5 5c3.3 6 9.6 11.5 17.8 11.5z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.4c-.5.4 6.7-4.9 6.7-13.4 0-1.5-.2-2.9-.4-4.5z"
            />
          </svg>
        </span>
      )}
      Continue with Google
    </button>
  );
}
