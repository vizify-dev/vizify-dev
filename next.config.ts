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
      "*.ts": {
        condition: {
          all: [
            { path: /src\/lib\/table\/tools\/runtime\.ts$/ },
            { query: "?raw" },
          ],
        },
        loaders: [require.resolve("./scripts/ts-to-text-loader.cjs")],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
