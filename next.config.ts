import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.html": {
        condition: { path: /src\/lib\/table-tools\/bar\.html$/ },
        type: "text",
      },
      "*.css": {
        condition: { path: /src\/lib\/table-tools\/bar\.css$/ },
        type: "text",
      },
    },
  },
};

export default nextConfig;
