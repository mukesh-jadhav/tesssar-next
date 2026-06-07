/** @type {import('next').NextConfig} */

// Defense-in-depth response headers. CSP is the most expensive line of
// defense and is intentionally permissive on `script-src` because Next.js
// App Router emits inline bootstrap scripts on every page. The next
// hardening step is per-request nonces via middleware (strict-dynamic);
// until then, the real XSS guard is sanitized rendering at every sink
// (see Mermaid's `securityLevel: "strict"` + `htmlLabels: false`).
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required for Next App Router bootstrap; replace
  // with nonce-based CSP via middleware in a follow-up.
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://apis.google.com https://accounts.google.com https://www.gstatic.com",
  "script-src-elem 'self' 'unsafe-inline' https://checkout.razorpay.com https://apis.google.com https://accounts.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://cdn.simpleicons.org https://*.googleusercontent.com",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://api.razorpay.com https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com wss://*.firebaseio.com",
  "frame-src https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com https://tessar-next.firebaseapp.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Content-Security-Policy", value: csp },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      "@google-cloud/vertexai",
      "firebase-admin",
      "@react-pdf/renderer",
      "razorpay",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
