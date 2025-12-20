import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: {
    compilationMode: "annotation",
  },
  redirects() {
    return [
      {
        source: "/login",
        destination: "/auth",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/auth",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
