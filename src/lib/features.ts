export const FEATURES = {
  table: process.env.NEXT_PUBLIC_FEATURE_TABLE === "true",
  auth: process.env.NEXT_PUBLIC_FEATURE_AUTH === "true", // Save + Sign in
};