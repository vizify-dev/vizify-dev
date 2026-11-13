import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.html": {
        condition: {
          path: /src\/lib\/(?:resume\/templates|table\/(?:tools\/(?:bar|script)|preview\/(?:document|interactive\.script|table|header-cell|row|data-cell|header-break))|jiraboard\/(?:templates\/[^/]+|runtime\/board\.script)|cards\/(?:templates\/[^/]+|runtime\/cards\.script)|certificates\/(?:templates\/[^/]+|runtime\/certificates\.script))\.html$/,
        },
        type: "text",
      },
      "*.css": {
        condition: {
          path: /src\/lib\/(?:table\/(?:tools\/bar|preview\/(?:base|interactive|print))|jiraboard\/styles\/.*|cards\/styles\/.*|certificates\/styles\/.*)\.css$/,
        },
        type: "text",
      },
      "*.txt": {
        condition: {
          path: /src\/lib\/(?:table\/(?:tools\/runtime|preview\/interactive\.runtime)|jiraboard\/runtime\/board\.runtime|cards\/runtime\/cards\.runtime|certificates\/runtime\/certificates\.runtime)\.generated\.txt$/,
        },
        type: "text",
      },
    },
  },
};

export default nextConfig;
