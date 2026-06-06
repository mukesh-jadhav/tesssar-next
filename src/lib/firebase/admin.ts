import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function buildApp(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // On Cloud Run with a bound service account, ADC works without explicit creds.
  if (!clientEmail || !privateKey) {
    return initializeApp({ projectId });
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const app = buildApp();
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

// Cookies session (5 days).
//
// IMPORTANT: must be named `__session` — Firebase Hosting's CDN strips
// every other cookie on the way back to the browser to preserve cache
// semantics. Renaming this breaks sign-in on tessar.dev.
//   https://firebase.google.com/docs/hosting/manage-cache#using_cookies
export const SESSION_COOKIE_NAME = "__session";
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;
