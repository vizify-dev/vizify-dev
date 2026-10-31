/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS webpack loader */
const ts = require("typescript");

module.exports = function tsToTextLoader(source) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2018,
      module: ts.ModuleKind.None,
    },
    fileName: this.resourcePath,
  });
  return `export default ${JSON.stringify(result.outputText)};`;
};
