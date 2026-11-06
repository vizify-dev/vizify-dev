import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.html": {
        condition: {
          path: /src\/lib\/(?:resume\/templates|table\/(?:tools\/(?:bar|script)|preview\/(?:document|interactive\.script|table|header-cell|row|data-cell|header-break))|cards\/(?:templates\/[^/]+|runtime\/cards\.script))\.html$/,
        },
        type: "text",
      },
      "*.css": {
        condition: {
          any: [
            {
              all: [
                {
                  path: /src\/lib\/table\/(tools\/bar|preview\/(base|interactive|print))\.css$/,
                },
                { query: "?raw" },
              ],
            },
            {
              all: [
                { path: /src\/lib\/cards\/styles\/.*\.css$/ },
                { query: "?raw" },
              ],
            },
          ],
        },
        type: "text",
      },
      "*.txt": {
        condition: {
          path: /src\/lib\/cards\/runtime\/cards\.runtime\.generated\.txt$/,
        },
        type: "text",
      },
      "*.ts": {
        condition: {
          all: [
            {
              path: /src\/lib\/table\/(tools\/runtime|preview\/interactive\.runtime)\.ts$/,
            },
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
