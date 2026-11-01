import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const runtimePaths = [
  "../src/lib/table/tools/runtime.ts",
  "../src/lib/table/preview/interactive.runtime.ts",
];
let hasErrors = false;

for (const runtimePath of runtimePaths) {
  const sourcePath = fileURLToPath(new URL(runtimePath, import.meta.url));
  const outputPath = path.join(
    path.dirname(sourcePath),
    `${path.basename(sourcePath, ".ts")}.generated.txt`,
  );
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
    hasErrors = true;
  } else {
    await writeFile(outputPath, result.outputText, "utf8");
  }
}

if (hasErrors) process.exitCode = 1;
