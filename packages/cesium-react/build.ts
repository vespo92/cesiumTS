import { build } from "bun";
import { copyFileSync, mkdirSync, existsSync } from "fs";

// Build the package
async function buildPackage() {
  console.log("Building @cesiumts/react...");

  // Ensure dist directory exists
  if (!existsSync("./dist")) {
    mkdirSync("./dist", { recursive: true });
  }

  // Build ESM
  await build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    format: "esm",
    target: "browser",
    external: ["react", "react-dom", "cesium"],
    naming: "[name].mjs",
  });

  // Build CJS
  await build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    format: "cjs",
    target: "browser",
    external: ["react", "react-dom", "cesium"],
    naming: "[name].js",
  });

  console.log("Build complete!");
}

buildPackage().catch(console.error);
