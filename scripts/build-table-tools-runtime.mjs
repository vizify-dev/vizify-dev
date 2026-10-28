import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = fileURLToPath(new URL("../src/lib/table-tools/runtime.ts", import.meta.url));
const outputPath = path.join(path.dirname(sourcePath), "runtime.generated.txt");
const source = await readFile(sourcePath, "utf8");
const result = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.None,
  },
  fileName: sourcePath,
  reportDiagnostics: true,
});
const errors = (result.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);

if (errors.length > 0) {
  console.error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory: process.cwd,
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => "\n",
  }));
  process.exitCode = 1;
} else {
  await writeFile(outputPath, result.outputText, "utf8");
}
