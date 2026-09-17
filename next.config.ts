import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.147.228.105"],
  images: {
    unoptimized: true,
  },
  experimental: {
    proxyClientMaxBodySize: 30, // 30 MB — allows 25 MB PDF uploads
  },
  devIndicators: false,

  // Keep pdfjs as a plain Node dependency so the legacy build
  // works at runtime for server-side page counting.
  serverExternalPackages: ["pdfjs-dist", "@aws-sdk/client-s3"],

  // Exclude the heavy storage directory (PDFs, large covers) from the
  // serverless function bundle. On Vercel Hobby this keeps each lambda
  // under the 50 MB limit and avoids the 12-function cap.
  // Cover images in public/ are still deployed as static assets by Vercel.
  // PDFs fall through to the DB (StoredFile) or S3 fallback at runtime.
  outputFileTracingExcludes: {
    "/*": ["storage/**"],
  },

  // PWA headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' ws: wss: http: https:",
              "worker-src 'self' blob: https://cdn.jsdelivr.net",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
