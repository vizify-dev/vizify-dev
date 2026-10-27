import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.html": {
        condition: { path: /src\/lib\/(?:table-tools\/bar|preview\/document)\.html$/ },
        type: "text",
      },
      "*.css": {
        condition: { path: /src\/lib\/(?:table-tools\/bar|preview\/(?:base|interactive|print))\.css$/ },
        type: "text",
      },
    },
  },
};

export default nextConfig;
