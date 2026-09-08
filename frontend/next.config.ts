import type { NextConfig } from "next";

// Set BACKEND_URL in the Vercel project's Environment Variables to the
// deployed backend's URL (e.g. https://your-backend-project.vercel.app).
// Falls back to localhost for local development.
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  agentRules: false,
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
