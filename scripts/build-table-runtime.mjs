import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src", "lib", "table", "tools", "runtime.ts");
const outputPath = path.join(
  root,
  "src",
  "lib",
  "table",
  "tools",
  "runtime.generated.txt",
);
const source = await readFile(sourcePath, "utf8");
const result = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2018,
    module: ts.ModuleKind.None,
  },
  fileName: sourcePath,
  reportDiagnostics: true,
});
const errors = (result.diagnostics ?? []).filter(
  (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
);

if (errors.length > 0) {
  for (const diagnostic of errors) {
    console.error(
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    );
  }
  process.exitCode = 1;
} else {
  await writeFile(outputPath, result.outputText);
}
