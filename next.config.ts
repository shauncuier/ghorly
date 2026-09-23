import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy.
 *
 * `'unsafe-inline'` on styles is required: Tailwind is fine, but Next injects
 * inline style attributes and the charts set inline widths. Scripts do *not*
 * get it in production — `'unsafe-eval'` is dev-only because Turbopack's HMR
 * needs it, and shipping it would defeat most of the point of a CSP.
 *
 * `connect-src` stays 'self': the app talks only to its own API. Add your
 * MongoDB Atlas / analytics / error-reporting origins here when you add them.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Clickjacking. `frame-ancestors` above covers modern browsers; this is the
  // belt-and-braces header for older ones.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/**
 * The demo clock anchor, decided once per build and baked into both bundles.
 *
 * `lib/data/clock.ts` reads this. Fixing it here rather than calling
 * `new Date()` inside the app is what keeps the server HTML and the first
 * client render byte-identical — a render-time clock read would compute from
 * the server's timezone and the browser's, and any relative time would
 * mismatch and trip a hydration error.
 *
 * Because the seed is written entirely as offsets from this anchor, rebuilding
 * or reseeding re-dates the whole dataset to "now" for free.
 */
function buildAnchor(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T10:00`;
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GHORLY_ANCHOR: buildAnchor(),
  },
  // Don't advertise the framework version to scanners.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // HSTS only in production: sending it from localhost would pin
          // http://localhost to HTTPS in the developer's browser.
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      {
        // Nothing under /api may be cached by a shared cache — responses are
        // scoped to the signed-in user.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
