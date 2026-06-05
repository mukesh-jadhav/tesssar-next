/** @type {import('next').NextConfig} */
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
};

export default nextConfig;
