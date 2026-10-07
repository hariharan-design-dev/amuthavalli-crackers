import type { NextConfig } from "next";

/**
 * Project Rule: External Image Host Configuration
 * Any new external image source used with Next.js `next/image` must have its hostname
 * explicitly reviewed and added to `next.config.ts`. Do not use arbitrary external image
 * hosts or bypass next/image configuration with plain img tags.
 */

// 1. Determine current environment's Supabase hostname
const currentSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iueuoswckamxcgigokwj.supabase.co";
const currentHostname = new URL(currentSupabaseUrl).hostname;

// 2. Explicitly allow the known legacy/development hostname embedded in existing database absolute URLs
const legacyHostname = "iueuoswckamxcgigokwj.supabase.co";

// Deduplicate hostnames to avoid Next.js configuration errors
const allowedHostnames = Array.from(new Set([currentHostname, legacyHostname]));

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: allowedHostnames.map(hostname => ({
      protocol: "https",
      hostname: hostname,
      pathname: "/storage/v1/object/public/**",
    })),
  },
};

export default nextConfig;
