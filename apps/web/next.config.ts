import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Baseline Content-Security-Policy. Starts strict; relax per-route via
// route-level headers if a feature genuinely needs it. We ship Report-Only
// outside production until field data confirms no breakage, then flip to
// enforcing.
//
// `'unsafe-eval'` and `'unsafe-inline'` are scoped to the script-src
// directive only because Next's dev runtime needs them; production gets
// the strict policy. If we adopt Next's built-in nonce support we can
// remove `'unsafe-inline'` entirely.
const cspDirectives = [
  "default-src 'self'",
  isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
];
const cspHeaderKey = isProd
  ? "Content-Security-Policy-Report-Only"
  : "Content-Security-Policy-Report-Only";

const nextConfig: NextConfig = {
  reactCompiler: true,

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "date-fns",
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          // X-XSS-Protection is deprecated; CSP supersedes it.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: cspHeaderKey, value: cspDirectives.join("; ") },
        ],
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Replace with your real CDN/asset hostnames before deploy.
      { protocol: "https", hostname: "**.talent-os.app" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
