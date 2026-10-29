import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.html": {
        type: "text",
      },
      "*.css": {
        condition: {
          all: [
            { path: /src\/lib\/table\/(tools\/bar|preview\/document)\.css$/ },
            { query: "?raw" },
          ],
        },
        type: "text",
      },
      "*.txt": {
        condition: { path: /src\/lib\/table\/tools\/runtime\.generated\.txt$/ },
        type: "text",
      },
    },
  },
};

export default nextConfig;
