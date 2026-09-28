import { registerHooks } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT_DIR = process.cwd();

function tryResolveTs(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) return basePath;
  for (const ext of [".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.js"]) {
    const candidate = basePath + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(ROOT_DIR, "src", specifier.slice(2));
      const resolved = tryResolveTs(target);
      if (resolved) {
        return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
    } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
      if (context.parentURL && context.parentURL.startsWith("file:")) {
        const parentDir = path.dirname(fileURLToPath(context.parentURL));
        const target = path.resolve(parentDir, specifier);
        const resolved = tryResolveTs(target);
        if (resolved) {
          return { url: pathToFileURL(resolved).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && (url.endsWith(".ts") || url.endsWith(".tsx"))) {
      const filePath = fileURLToPath(url);
      const sourceText = fs.readFileSync(filePath, "utf-8");
      const transpiled = ts.transpileModule(sourceText, {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      });
      return {
        format: "module",
        source: transpiled.outputText,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
