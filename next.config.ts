import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.html": {
        condition: {
          path: /src\/lib\/(?:resume\/templates|table\/(?:tools\/(?:bar|script)|preview\/(?:document|interactive\.script|table|header-cell|row|data-cell|header-break)))\.html$/,
        },
        type: "text",
      },
      "*.css": {
        condition: { path: /src\/lib\/table\/(?:tools\/bar|preview\/(?:base|interactive|print))\.css$/ },
        type: "text",
      },
      "*.txt": {
        condition: {
          path: /src\/lib\/table\/(?:tools\/runtime|preview\/interactive\.runtime)\.generated\.txt$/,
        },
        type: "text",
      },
    },
  },
};

export default nextConfig;
