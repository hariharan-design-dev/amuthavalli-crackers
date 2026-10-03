import type { NextConfig } from "next";

/**
 * Project Rule: External Image Host Configuration
 * Any new external image source used with Next.js `next/image` must have its hostname
 * explicitly reviewed and added to `next.config.ts`. Do not use arbitrary external image
 * hosts or bypass next/image configuration with plain img tags.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iueuoswckamxcgigokwj.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
