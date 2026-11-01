declare module "*.html" {
  const content: string;
  export default content;
}

declare module "*.css?raw" {
  const content: string;
  export default content;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.txt" {
  const content: string;
  export default content;
}
