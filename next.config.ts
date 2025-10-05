import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default () => {
  const nextConfig: NextConfig = {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    devIndicators: {
      position: "bottom-right",
    },
    env: {
      NO_HTTPS: process.env.NO_HTTPS,
    },
    experimental: {
      taint: true,
      authInterrupts: true,
      serverActions: {
        // domains only, no protocol
        allowedOrigins: ["localhost:3000", "*.app.github.dev"],
        // legacy option for older Next builds
        allowedForwardedHosts: ["*.app.github.dev"],
      },
    },
  };
  const withNextIntl = createNextIntlPlugin();
  return withNextIntl(nextConfig);
};
