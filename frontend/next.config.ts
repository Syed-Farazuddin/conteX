import path from "node:path";
import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Monorepo has a root package-lock.json — pin Turbopack to the Next app folder
  turbopack: {
    root: frontendRoot,
  },
  transpilePackages: ["@imgly/background-removal"],
};

export default nextConfig;
