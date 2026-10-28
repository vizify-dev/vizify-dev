import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.html": {
        condition: { path: /src\/lib\/table-tools\/(?:bar|script)\.html$/ },
        type: "text",
      },
      "*.css": {
        condition: { path: /src\/lib\/table-tools\/bar\.css$/ },
        type: "text",
      },
      "*.txt": {
        condition: { path: /src\/lib\/table-tools\/runtime\.generated\.txt$/ },
        type: "text",
      },
    },
  },
};

export default nextConfig;
