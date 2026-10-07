import type { NextConfig } from "next";

// A normal Next.js build produces output that expects the full project dependencies to remain available at runtime. Standalone output creates a smaller runtime bundle containing the server and required dependencies.

// This is especially useful for Docker because the final image can run without copying the entire node_modules directory.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
