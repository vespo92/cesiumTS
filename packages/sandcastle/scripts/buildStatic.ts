import { build, defineConfig, type UserConfig, type LogLevel, type Plugin } from "vite";
import baseConfig from "../vite.config.js";
import { fileURLToPath } from "url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { dirname, join } from "path";
import { cesiumPathReplace, insertImportMap } from "../vite-plugins.js";
import typescriptCompile from "./typescriptCompile.js";

interface ImportObject {
  path: string;
  typesPath: string;
}

type ImportList = Record<string, ImportObject>;

function checkForImport(imports: ImportList, name: string): void {
  if (!imports[name]) {
    throw new Error(`Missing import for ${name}`);
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));

interface CopyTarget {
  src: string;
  dest: string;
}

interface SandcastleConfigOptions {
  outDir: string;
  basePath: string;
  cesiumBaseUrl: string;
  cesiumVersion: string;
  commitSha?: string;
  imports: ImportList;
  copyExtraFiles?: CopyTarget[];
}

/**
 * Create the Vite configuration for building Sandcastle.
 * Set where it should build to and the base path for vite and CesiumJS files.
 *
 * Most importantly specify the paths the app can find the library imports.
 *
 * If you are copying files to the built directory ensure the source files exist BEFORE attempting to build Sandcastle
 */
export function createSandcastleConfig({
  outDir,
  basePath,
  cesiumBaseUrl,
  cesiumVersion,
  commitSha,
  imports,
  copyExtraFiles = [],
}: SandcastleConfigOptions): UserConfig {
  if (!cesiumVersion || cesiumVersion === "") {
    throw new Error("Must provide a CesiumJS version");
  }

  const config: UserConfig = { ...baseConfig };

  config.base = basePath;

  config.build = {
    ...config.build,
    outDir: outDir,
  };

  const copyPlugin = viteStaticCopy({
    targets: [
      { src: "templates/Sandcastle.(d.ts|js)", dest: "templates" },
      ...copyExtraFiles,
    ],
  });

  checkForImport(imports, "cesium");
  checkForImport(imports, "@cesium/engine");
  checkForImport(imports, "@cesium/widgets");
  if (imports["Sandcastle"]) {
    throw new Error(
      "Don't specify the Sandcastle import this is taken care of internally",
    );
  }

  const importMap: Record<string, string> = {
    Sandcastle: "../templates/Sandcastle.js",
  };
  const typePaths: Record<string, string> = {
    Sandcastle: "../templates/Sandcastle.d.ts",
  };
  for (const [key, value] of Object.entries(imports)) {
    importMap[key] = value.path;
    typePaths[key] = value.typesPath;
  }

  config.define = {
    ...config.define,
    __VITE_TYPE_IMPORT_PATHS__: JSON.stringify(typePaths),
    __CESIUM_VERSION__: JSON.stringify(`Cesium ${cesiumVersion}`),
    __COMMIT_SHA__: JSON.stringify(commitSha ?? undefined),
  };

  const plugins = (config.plugins ?? []) as Plugin[];
  config.plugins = [
    ...plugins,
    copyPlugin,
    cesiumPathReplace(cesiumBaseUrl),
    insertImportMap(importMap, ["bucket.html", "standalone.html"]),
  ];

  return defineConfig(config) as UserConfig;
}

/**
 * Build Sandcastle out to a specified location as static files.
 * The config should be generated with the `createSandcastleConfig` function.
 *
 * The build will only set up the paths for "external" resources from the app.
 * If you are copying files to the built directory ensure the source files exist BEFORE attempting to build Sandcastle
 */
export async function buildStatic(
  config: UserConfig,
  logLevel: LogLevel = "warn",
): Promise<void> {
  // We have to do the compile for the Sandcastle API outside of the vite build
  // because we need to reference the js file and types directly from the app
  // and we don't want them bundled with the rest of the code
  const exitCode = await typescriptCompile(
    join(__dirname, "../templates/tsconfig.lib.json"),
  );

  if (exitCode === 0) {
    console.log(`Sandcastle typescript build complete`);
  } else {
    throw new Error("Sandcastle typescript build failed");
  }

  console.log("Building Sandcastle with Vite");
  await build({
    ...config,
    root: join(__dirname, "../"),
    logLevel,
  });
}
