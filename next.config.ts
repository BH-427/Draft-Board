import type { NextConfig } from "next";

// Note: as of Next.js 16, ESLint is no longer integrated into `next build`
// (it's a standalone step via eslint.config.mjs / `next lint` now), so
// lint errors — including some pre-existing ones in lib/useDraftData.tsx —
// can't block the production build the way they could in older Next
// versions. Nothing to configure here for that.
const nextConfig: NextConfig = {};

export default nextConfig;