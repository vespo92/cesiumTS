import child_process from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import path from "node:path";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";

import esbuild, {
  type BuildOptions,
  type BuildResult,
  type BuildContext,
  type Plugin,
  type OnLoadArgs,
  type Message,
} from "esbuild";
import { globby } from "globby";
import glslStripComments from "glsl-strip-comments";
import gulp from "gulp";
import { rimraf } from "rimraf";

import { mkdirp } from "mkdirp";

// Determines the scope of the workspace packages. If the scope is set to cesium, the workspaces should be @cesium/engine.
// This should match the scope of the dependencies of the root level package.json.
const scope = "cesium";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");

export async function getVersion(): Promise<string> {
  const data = await readFile(packageJsonPath, "utf8");
  const { version } = JSON.parse(data);
  return version;
}

async function getCopyrightHeader(): Promise<string> {
  const copyrightHeaderTemplate = await readFile(
    path.join("Source", "copyrightHeader.js"),
    "utf8",
  );
  return copyrightHeaderTemplate.replace("${version}", await getVersion());
}

function escapeCharacters(token: string): string {
  return token.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function constructRegex(pragma: string, exclusive: boolean): RegExp {
  const prefix = exclusive ? "exclude" : "include";
  pragma = escapeCharacters(pragma);

  const s =
    `[\\t ]*\\/\\/>>\\s?${prefix}Start\\s?\\(\\s?(["'])${pragma}\\1\\s?,\\s?pragmas\\.${pragma}\\s?\\)\\s?;?` +
    // multiline code block
    `[\\s\\S]*?` +
    // end comment
    `[\\t ]*\\/\\/>>\\s?${prefix}End\\s?\\(\\s?(["'])${pragma}\\2\\s?\\)\\s?;?\\s?[\\t ]*\\n?`;

  return new RegExp(s, "gm");
}

const pragmas: Record<string, boolean> = {
  debug: false,
};

const stripPragmaPlugin: Plugin = {
  name: "strip-pragmas",
  setup: (build) => {
    build.onLoad({ filter: /\.js$/ }, async (args: OnLoadArgs) => {
      let source = await readFile(args.path, { encoding: "utf8" });

      try {
        for (const key in pragmas) {
          if (Object.prototype.hasOwnProperty.call(pragmas, key)) {
            source = source.replace(constructRegex(key, pragmas[key]!), "");
          }
        }

        return { contents: source };
      } catch (e) {
        const error = e as Error;
        return {
          errors: [
            {
              text: error.message,
            },
          ],
        };
      }
    });
  },
};

interface BuildWarningLocation {
  column: number;
  file: string;
  line: number;
  lineText: string;
  suggestion?: string;
}

interface BuildWarning {
  location: BuildWarningLocation;
  text: string;
}

// Print an esbuild warning
function printBuildWarning({ location, text }: BuildWarning): void {
  const { column, file, line, lineText, suggestion } = location;

  let message = `\n
  > ${file}:${line}:${column}: warning: ${text}
  ${lineText}
  `;

  if (suggestion && suggestion !== "") {
    message += `\n${suggestion}`;
  }

  console.log(message);
}

// Ignore `eval` warnings in third-party code we don't have control over
function handleBuildWarnings(result: BuildResult): void {
  for (const warning of result.warnings) {
    if (warning.location && !warning.location.file.includes("protobufjs.js")) {
      printBuildWarning(warning as unknown as BuildWarning);
    }
  }
}

export const defaultESBuildOptions = (): BuildOptions => {
  return {
    bundle: true,
    color: true,
    legalComments: "inline" as const,
    logLimit: 0,
    target: "es2020",
  };
};

interface WorkspaceGlobs {
  [workspace: string]: string[];
}

export async function getFilesFromWorkspaceGlobs(
  workspaceGlobs: WorkspaceGlobs,
): Promise<string[]> {
  let files: string[] = [];
  // Iterate over each workspace and generate declarations for each file.
  for (const workspace of Object.keys(workspaceGlobs)) {
    // Since workspace source files are provided relative to the workspace,
    // the workspace path needs to be prepended.
    const workspacePath = `packages/${workspace.replace(`${scope}/`, ``)}`;
    const filesPaths = workspaceGlobs[workspace]!.map((glob: string) => {
      if (glob.indexOf(`!`) === 0) {
        return `!`.concat(workspacePath, `/`, glob.replace(`!`, ``));
      }
      return workspacePath.concat("/", glob);
    });

    files = files.concat(await globby(filesPaths));
  }
  return files;
}

const inlineWorkerPath = "Build/InlineWorkers.js";

/**
 * @typedef {object} CesiumBundles
 * @property {object} esm The ESM bundle.
 * @property {object} iife The IIFE bundle, for use in browsers.
 * @property {object} node The CommonJS bundle, for use in NodeJS.
 */

interface BundleCesiumJsOptions {
  path: string;
  minify?: boolean;
  removePragmas?: boolean;
  sourcemap?: boolean;
  iife?: boolean;
  node?: boolean;
  incremental?: boolean;
  write?: boolean;
}

interface CesiumContexts {
  esm?: BuildContext | BuildResult;
  iife?: BuildContext | BuildResult;
  iifeWorkers?: BuildContext | BuildResult | void;
  node?: BuildContext | BuildResult;
}

/**
 * Bundles all individual modules, optionally minifying and stripping out debug pragmas.
 */
export async function bundleCesiumJs(
  options: BundleCesiumJsOptions,
): Promise<CesiumContexts> {
  const buildConfig: BuildOptions = {
    ...defaultESBuildOptions(),
    entryPoints: ["Source/Cesium.js"],
    minify: options.minify,
    sourcemap: options.sourcemap,
    plugins: options.removePragmas ? [stripPragmaPlugin] : undefined,
    write: options.write,
    banner: {
      js: await getCopyrightHeader(),
    },
    // print errors immediately, and collect warnings so we can filter out known ones
    logLevel: "info",
  };

  const contexts: CesiumContexts = {};
  const incremental = options.incremental;
  const build = incremental ? esbuild.context : esbuild.build;

  // Build ESM
  const esm = await build({
    ...buildConfig,
    format: "esm",
    outfile: path.join(options.path, "index.js"),
  });

  if (incremental) {
    contexts.esm = esm;
  } else {
    handleBuildWarnings(esm as BuildResult);
  }

  // Build IIFE
  if (options.iife) {
    const iifeWorkers = await bundleWorkers({
      iife: true,
      minify: options.minify,
      sourcemap: false,
      path: options.path,
      removePragmas: options.removePragmas,
      incremental: incremental,
      write: options.write,
    });

    const iife = await build({
      ...buildConfig,
      format: "iife",
      inject: [inlineWorkerPath],
      globalName: "Cesium",
      outfile: path.join(options.path, "Cesium.js"),
      logOverride: {
        "empty-import-meta": "silent",
      },
    });

    if (incremental) {
      contexts.iife = iife;
      contexts.iifeWorkers = iifeWorkers;
    } else {
      handleBuildWarnings(iife as BuildResult);
      rimraf.sync(inlineWorkerPath);
    }
  }

  if (options.node) {
    const node = await build({
      ...buildConfig,
      format: "cjs",
      platform: "node",
      logOverride: {
        "empty-import-meta": "silent",
      },
      define: {
        // TransformStream is a browser-only implementation depended on by zip.js
        TransformStream: "null",
      },
      outfile: path.join(options.path, "index.cjs"),
    });

    if (incremental) {
      contexts.node = node;
    } else {
      handleBuildWarnings(node as BuildResult);
    }
  }

  return contexts;
}

function filePathToModuleId(moduleId: string): string {
  return moduleId.substring(0, moduleId.lastIndexOf(".")).replace(/\\/g, "/");
}

const workspaceSourceFiles: WorkspaceGlobs = {
  engine: [
    "packages/engine/Source/**/*.js",
    "!packages/engine/Source/*.js",
    "!packages/engine/Source/Workers/**",
    "packages/engine/Source/Workers/createTaskProcessorWorker.js",
    "!packages/engine/Source/ThirdParty/Workers/**.js",
    "!packages/engine/Source/ThirdParty/google-earth-dbroot-parser.js",
    "!packages/engine/Source/ThirdParty/_*",
  ],
  widgets: ["packages/widgets/Source/**/*.js"],
};

/**
 * Generates export declaration from a file from a workspace.
 *
 * @param workspace The workspace the file belongs to.
 * @param file The file.
 * @returns The export declaration.
 */
function generateDeclaration(workspace: string, file: string): string {
  let assignmentName = path.basename(file, path.extname(file));

  let moduleId = file;
  moduleId = filePathToModuleId(moduleId);

  if (moduleId.indexOf("Source/Shaders") > -1) {
    assignmentName = `_shaders${assignmentName}`;
  }
  assignmentName = assignmentName.replace(/(\.|-)/g, "_");
  return `export { ${assignmentName} } from '@${scope}/${workspace}';`;
}

/**
 * Creates a single entry point file, Cesium.js, which imports all individual modules exported from the Cesium API.
 * @returns contents
 */
export async function createCesiumJs(): Promise<string> {
  const version = await getVersion();
  let contents = `export const VERSION = '${version}';\n`;

  // Iterate over each workspace and generate declarations for each file.
  for (const workspace of Object.keys(workspaceSourceFiles)) {
    const files = await globby(workspaceSourceFiles[workspace]!);
    const declarations = files.map((file) =>
      generateDeclaration(workspace, file),
    );
    contents += declarations.join(`${EOL}`);
    contents += "\n";
  }
  await writeFile("Source/Cesium.js", contents, { encoding: "utf-8" });

  return contents;
}

interface BundleIndexJsOptions {
  outputDirectory: string;
  entryPoint: string;
  minify?: boolean;
  removePragmas?: boolean;
  sourcemap?: boolean;
  incremental?: boolean;
  write?: boolean;
}

interface IndexJsContexts {
  esm?: BuildContext | BuildResult;
}

/**
 * Bundles all individual modules, optionally minifying and stripping out debug pragmas.
 */
export async function bundleIndexJs(
  options: BundleIndexJsOptions,
): Promise<IndexJsContexts> {
  const buildConfig: BuildOptions = {
    ...defaultESBuildOptions(),
    entryPoints: [options.entryPoint],
    minify: options.minify,
    sourcemap: options.sourcemap,
    plugins: options.removePragmas ? [stripPragmaPlugin] : undefined,
    write: options.write,
    banner: {
      js: await getCopyrightHeader(),
    },
    // print errors immediately, and collect warnings so we can filter out known ones
    logLevel: "info",
  };

  const contexts: IndexJsContexts = {};
  const incremental = options.incremental ?? false;
  const build = incremental ? esbuild.context : esbuild.build;

  // Build ESM
  const esm = await build({
    ...buildConfig,
    format: "esm",
    outfile: path.join(options.outputDirectory, "index.js"),
    // NOTE: doing this requires an importmap defined in the browser but avoids multiple CesiumJS instances
    external: options.entryPoint.includes("engine") ? [] : ["@cesium/engine"],
  });

  if (incremental) {
    contexts.esm = esm;
  } else {
    handleBuildWarnings(esm as BuildResult);
  }

  return contexts;
}

const workspaceSpecFiles: WorkspaceGlobs = {
  engine: ["packages/engine/Specs/**/*Spec.js"],
  widgets: ["packages/widgets/Specs/**/*Spec.js"],
};

/**
 * Creates a single entry point file, Specs/SpecList.js, which imports all individual spec files.
 * @returns contents
 */
export async function createCombinedSpecList(): Promise<string> {
  const version = await getVersion();
  let contents = `export const VERSION = '${version}';\n`;

  for (const workspace of Object.keys(workspaceSpecFiles)) {
    const files = await globby(workspaceSpecFiles[workspace]!);
    for (const file of files) {
      contents += `import '../${file}';\n`;
    }
  }

  await writeFile(path.join("Specs", "SpecList.js"), contents, {
    encoding: "utf-8",
  });

  return contents;
}

interface BundleWorkersOptions {
  path: string;
  iife?: boolean;
  minify?: boolean;
  removePragmas?: boolean;
  sourcemap?: boolean;
  incremental?: boolean;
  write?: boolean;
}

/**
 * Bundles workers for CesiumJS.
 */
export async function bundleWorkers(
  options: BundleWorkersOptions,
): Promise<BuildContext | BuildResult | void> {
  // Copy ThirdParty workers
  const thirdPartyWorkers = await globby([
    "packages/engine/Source/ThirdParty/Workers/**.js",
    "!packages/engine/Source/ThirdParty/Workers/basis_transcoder.js",
  ]);

  const thirdPartyWorkerConfig: BuildOptions = {
    ...defaultESBuildOptions(),
    bundle: false,
    entryPoints: thirdPartyWorkers,
    outdir: options.path,
    minify: options.minify,
    outbase: "packages/engine/Source",
  };
  await esbuild.build(thirdPartyWorkerConfig);

  // Bundle Cesium workers
  const workers = await globby(["packages/engine/Source/Workers/**"]);
  const workerConfig: BuildOptions = {
    ...defaultESBuildOptions(),
    bundle: true,
    external: ["fs", "path"],
  };

  if (options.iife) {
    let contents = ``;
    const files = await globby(workers);
    const declarations = files.map((file) => {
      let assignmentName = path.basename(file, path.extname(file));
      assignmentName = assignmentName.replace(/(\.|-)/g, "_");
      return `export const ${assignmentName} = () => { import('./${file}'); };`;
    });
    contents += declarations.join(`${EOL}`);
    contents += "\n";

    workerConfig.globalName = "CesiumWorkers";
    workerConfig.format = "iife";
    workerConfig.stdin = {
      contents: contents,
      resolveDir: ".",
    };
    workerConfig.minify = options.minify;
    workerConfig.write = false;
    workerConfig.logOverride = {
      "empty-import-meta": "silent",
    };
    workerConfig.plugins = options.removePragmas
      ? [stripPragmaPlugin]
      : undefined;
  } else {
    workerConfig.format = "esm";
    workerConfig.splitting = true;
    workerConfig.banner = {
      js: await getCopyrightHeader(),
    };
    workerConfig.entryPoints = workers;
    workerConfig.outdir = path.join(options.path, "Workers");
    workerConfig.minify = options.minify;
    workerConfig.write = options.write;
  }

  const incremental = options.incremental;
  const build = incremental ? esbuild.context : esbuild.build;

  if (!options.iife) {
    return build(workerConfig);
  }

  //if iife, write this output to it's own file in which the script content is exported
  const writeInjectionCode = (result: BuildResult): Promise<void> => {
    const bundle = result.outputFiles![0]!.contents;
    const base64 = Buffer.from(bundle).toString("base64");
    const contents = `globalThis.CESIUM_WORKERS = atob("${base64}");`;
    return writeFile(inlineWorkerPath, contents);
  };

  if (incremental) {
    const context = (await build(workerConfig)) as BuildContext;
    const originalRebuild = context.rebuild.bind(context);
    context.rebuild = async () => {
      const result = await originalRebuild();
      if (result) {
        await writeInjectionCode(result);
      }
      return result;
    };
    return context;
  }

  const result = (await build(workerConfig)) as BuildResult;
  await writeInjectionCode(result);
  return;
}

const shaderFiles = [
  "packages/engine/Source/Shaders/**/*.glsl",
  "packages/engine/Source/ThirdParty/Shaders/*.glsl",
];

export async function glslToJavaScript(
  minify: boolean,
  minifyStateFilePath: string,
  workspace: string,
): Promise<void> {
  await writeFile(minifyStateFilePath, minify.toString());
  const minifyStateFileLastModified = existsSync(minifyStateFilePath)
    ? statSync(minifyStateFilePath).mtime.getTime()
    : 0;

  // collect all currently existing JS files into a set, later we will remove the ones
  // we still are using from the set, then delete any files remaining in the set.
  const leftOverJsFiles: Record<string, boolean> = {};

  const files = await globby([
    `packages/${workspace}/Source/Shaders/**/*.js`,
    `packages/${workspace}/Source/ThirdParty/Shaders/*.js`,
  ]);
  files.forEach(function (file) {
    leftOverJsFiles[path.normalize(file)] = true;
  });

  const builtinFunctions: string[] = [];
  const builtinConstants: string[] = [];
  const builtinStructs: string[] = [];

  const glslFiles = await globby(shaderFiles);
  await Promise.all(
    glslFiles.map(async function (glslFile) {
      glslFile = path.normalize(glslFile);
      const baseName = path.basename(glslFile, ".glsl");
      const jsFile = `${path.join(path.dirname(glslFile), baseName)}.js`;

      // identify built in functions, structs, and constants
      const baseDir = path.join(
        `packages/${workspace}/`,
        "Source",
        "Shaders",
        "Builtin",
      );
      if (
        glslFile.indexOf(path.normalize(path.join(baseDir, "Functions"))) === 0
      ) {
        builtinFunctions.push(baseName);
      } else if (
        glslFile.indexOf(path.normalize(path.join(baseDir, "Constants"))) === 0
      ) {
        builtinConstants.push(baseName);
      } else if (
        glslFile.indexOf(path.normalize(path.join(baseDir, "Structs"))) === 0
      ) {
        builtinStructs.push(baseName);
      }

      delete leftOverJsFiles[jsFile];

      const jsFileExists = existsSync(jsFile);
      const jsFileModified = jsFileExists
        ? statSync(jsFile).mtime.getTime()
        : 0;
      const glslFileModified = statSync(glslFile).mtime.getTime();

      if (
        jsFileExists &&
        jsFileModified > glslFileModified &&
        jsFileModified > minifyStateFileLastModified
      ) {
        return;
      }

      let contents = await readFile(glslFile, { encoding: "utf8" });
      contents = contents.replace(/\r\n/gm, "\n");

      let copyrightComments = "";
      const extractedCopyrightComments = contents.match(
        /\/\*\*(?:[^*\/]|\*(?!\/)|\n)*?@license(?:.|\n)*?\*\//gm,
      );
      if (extractedCopyrightComments) {
        copyrightComments = `${extractedCopyrightComments.join("\n")}\n`;
      }

      if (minify) {
        contents = glslStripComments(contents);
        contents = contents
          .replace(/\s+$/gm, "")
          .replace(/^\s+/gm, "")
          .replace(/\n+/gm, "\n");
        contents += "\n";
      }

      contents = contents.split('"').join('\\"').replace(/\n/gm, "\\n\\\n");
      contents = `${copyrightComments}\
//This file is automatically rebuilt by the Cesium build process.\n\
export default "${contents}";\n`;

      return writeFile(jsFile, contents);
    }),
  );

  // delete any left over JS files from old shaders
  Object.keys(leftOverJsFiles).forEach(function (filepath) {
    rimraf.sync(filepath);
  });

  const generateBuiltinContents = function (
    contents: { imports: string[]; builtinLookup: string[] },
    builtins: string[],
    builtinPath: string,
  ): void {
    for (let i = 0; i < builtins.length; i++) {
      const builtin = builtins[i]!;
      contents.imports.push(
        `import czm_${builtin} from './${builtinPath}/${builtin}.js'`,
      );
      contents.builtinLookup.push(`czm_${builtin} : ` + `czm_${builtin}`);
    }
  };

  //generate the JS file for Built-in GLSL Functions, Structs, and Constants
  const contents = {
    imports: [] as string[],
    builtinLookup: [] as string[],
  };
  generateBuiltinContents(contents, builtinConstants, "Constants");
  generateBuiltinContents(contents, builtinStructs, "Structs");
  generateBuiltinContents(contents, builtinFunctions, "Functions");

  const fileContents = `//This file is automatically rebuilt by the Cesium build process.\n${contents.imports.join(
    "\n",
  )}\n\nexport default {\n    ${contents.builtinLookup.join(",\n    ")}\n};\n`;

  return writeFile(
    path.join(
      `packages/${workspace}/`,
      "Source",
      "Shaders",
      "Builtin",
      "CzmBuiltins.js",
    ),
    fileContents,
  );
}

const externalResolvePlugin: Plugin = {
  name: "external-cesium",
  setup: (build) => {
    // In Specs, when we import files from the source files, we import
    // them from the index.js files. This plugin replaces those imports
    // with the IIFE Cesium.js bundle that's loaded in the browser
    // in SpecRunner.html.
    build.onResolve({ filter: new RegExp(`index\.js$`) }, () => {
      return {
        path: "Cesium",
        namespace: "external-cesium",
      };
    });

    build.onResolve({ filter: /@cesium/ }, () => {
      return {
        path: "Cesium",
        namespace: "external-cesium",
      };
    });

    build.onLoad(
      {
        filter: new RegExp(`^Cesium$`),
        namespace: "external-cesium",
      },
      () => {
        const contents = `module.exports = Cesium`;
        return {
          contents,
        };
      },
    );
  },
};

interface DemoObject {
  name: string;
  isNew: boolean;
  img?: string;
}

/**
 * Creates a template html file in the Sandcastle app listing the gallery of demos
 */
export async function createGalleryList(
  noDevelopmentGallery?: boolean,
): Promise<BuildResult> {
  const demoObjects: DemoObject[] = [];
  const demoJSONs: string[] = [];
  const output = path.join("Apps", "Sandcastle", "gallery", "gallery-index.js");

  const fileList = ["Apps/Sandcastle/gallery/**/*.html"];
  if (noDevelopmentGallery) {
    fileList.push("!Apps/Sandcastle/gallery/development/**/*.html");
  }

  // In CI, the version is set to something like '1.43.0-branch-name-buildNumber'
  // We need to extract just the Major.Minor version
  const version = await getVersion();
  const majorMinor = version.match(/^(.*)\.(.*)\./);
  const major = majorMinor![1];
  const minor = Number(majorMinor![2]) - 1; // We want the last release, not current release
  const tagVersion = `${major}.${minor}`;

  // Get an array of demos that were added since the last release.
  // This includes newly staged local demos as well.
  let newDemos: string[] = [];
  try {
    newDemos = child_process
      .execSync(
        `git diff --name-only --diff-filter=A ${tagVersion} Apps/Sandcastle/gallery/*.html`,
        { stdio: ["pipe", "pipe", "ignore"] },
      )
      .toString()
      .trim()
      .split("\n");
  } catch {
    // On a Cesium fork, tags don't exist so we can't generate the list.
  }

  let helloWorld: DemoObject | undefined;
  const files = await globby(fileList);
  files.forEach(function (file) {
    const demo = filePathToModuleId(
      path.relative("Apps/Sandcastle/gallery", file),
    );

    const demoObject: DemoObject = {
      name: demo,
      isNew: newDemos.includes(file),
    };

    if (existsSync(`${file.replace(".html", "")}.jpg`)) {
      demoObject.img = `${demo}.jpg`;
    }

    demoObjects.push(demoObject);

    if (demo === "Hello World") {
      helloWorld = demoObject;
    }
  });

  demoObjects.sort(function (a, b) {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
    return 0;
  });

  const helloWorldIndex = Math.max(
    helloWorld ? demoObjects.indexOf(helloWorld) : 0,
    0,
  );

  for (let i = 0; i < demoObjects.length; ++i) {
    demoJSONs[i] = JSON.stringify(demoObjects[i], null, 2);
  }

  const galleryContents = `\
// This file is automatically rebuilt by the Cesium build process.\n\
const hello_world_index = ${helloWorldIndex};\n\
const VERSION = '${version}';\n\
const gallery_demos = [${demoJSONs.join(", ")}];\n\
const has_new_gallery_demos = ${newDemos.length > 0 ? "true;" : "false;"}\n`;

  await writeFile(output, galleryContents);

  // Compile CSS for Sandcastle
  return esbuild.build({
    entryPoints: [
      path.join("Apps", "Sandcastle", "templates", "bucketRaw.css"),
    ],
    minify: true,
    banner: {
      css: "/* This file is automatically rebuilt by the Cesium build process. */\n",
    },
    outfile: path.join("Apps", "Sandcastle", "templates", "bucket.css"),
  });
}

/**
 * Helper function to copy files.
 */
export async function copyFiles(
  globs: string[],
  destination: string,
  base?: string,
): Promise<NodeJS.ReadWriteStream> {
  const stream = gulp
    .src(globs, { nodir: true, base: base ?? "", encoding: false })
    .pipe(gulp.dest(destination));

  await finished(stream);
  return stream;
}

/**
 * Copy assets from engine.
 */
export async function copyEngineAssets(destination: string): Promise<void> {
  const engineStaticAssets = [
    "packages/engine/Source/**",
    "!packages/engine/Source/**/*.js",
    "!packages/engine/Source/**/*.ts",
    "!packages/engine/Source/**/*.glsl",
    "!packages/engine/Source/**/*.css",
    "!packages/engine/Source/**/*.md",
  ];

  await copyFiles(engineStaticAssets, destination, "packages/engine/Source");

  // Since the CesiumWidget was part of the Widgets folder, the files must be manually
  // copied over to the right directory.

  await copyFiles(
    ["packages/engine/Source/Widget/**", "!packages/engine/Source/Widget/*.js"],
    path.join(destination, "Widgets/CesiumWidget"),
    "packages/engine/Source/Widget",
  );
}

/**
 * Copy assets from widgets.
 */
export async function copyWidgetsAssets(destination: string): Promise<void> {
  const widgetsStaticAssets = [
    "packages/widgets/Source/**",
    "!packages/widgets/Source/**/*.js",
    "!packages/widgets/Source/**/*.ts",
    "!packages/widgets/Source/**/*.css",
    "!packages/widgets/Source/**/*.glsl",
    "!packages/widgets/Source/**/*.md",
  ];

  await copyFiles(widgetsStaticAssets, destination, "packages/widgets/Source");
}

/**
 * Creates .jshintrc for use in Sandcastle
 */
export async function createJsHintOptions(): Promise<string> {
  const jshintrc = JSON.parse(
    await readFile(path.join("Apps", "Sandcastle", ".jshintrc"), {
      encoding: "utf8",
    }),
  );

  const contents = `\
  // This file is automatically rebuilt by the Cesium build process.\n\
  const sandcastleJsHintOptions = ${JSON.stringify(jshintrc, null, 4)};\n`;

  await writeFile(
    path.join("Apps", "Sandcastle", "jsHintOptions.js"),
    contents,
  );

  return contents;
}

interface BundleSpecsOptions {
  incremental?: boolean;
  write?: boolean;
}

/**
 * Bundles spec files for testing in the browser and on the command line with karma.
 */
export async function bundleCombinedSpecs(
  options?: BundleSpecsOptions,
): Promise<BuildContext | BuildResult> {
  options = options || {};

  const build = options.incremental ? esbuild.context : esbuild.build;

  return build({
    entryPoints: [
      "Specs/spec-main.js",
      "Specs/SpecList.js",
      "Specs/karma-main.js",
    ],
    bundle: true,
    format: "esm",
    sourcemap: true,
    outdir: path.join("Build", "Specs"),
    plugins: [externalResolvePlugin],
    write: options.write,
  });
}

/**
 * Bundles test worker in used specs.
 */
export async function bundleTestWorkers(
  options?: BundleSpecsOptions,
): Promise<BuildContext | BuildResult> {
  options = options || {};

  const build = options.incremental ? esbuild.context : esbuild.build;

  const workers = await globby(["Specs/TestWorkers/**.js"]);
  return build({
    entryPoints: workers,
    bundle: true,
    format: "esm",
    sourcemap: true,
    outdir: path.join("Build", "Specs", "TestWorkers"),
    external: ["fs", "path"],
    write: options.write,
  });
}

/**
 * Creates the index.js for a package.
 */
export async function createIndexJs(workspace: string): Promise<string> {
  const version = await getVersion();
  let contents = `globalThis.CESIUM_VERSION = "${version}";\n`;

  // Iterate over all provided source files for the workspace and export the assignment based on file name.
  const workspaceSources = workspaceSourceFiles[workspace];
  if (!workspaceSources) {
    throw new Error(`Unable to find source files for workspace: ${workspace}`);
  }

  const files = await globby(workspaceSources);
  files.forEach(function (file) {
    file = path.relative(`packages/${workspace}`, file);

    let moduleId = file;
    moduleId = filePathToModuleId(moduleId);

    // Rename shader files, such that ViewportQuadFS.glsl is exported as _shadersViewportQuadFS in JS.

    let assignmentName = path.basename(file, path.extname(file));
    if (moduleId.indexOf(`Source/Shaders/`) === 0) {
      assignmentName = `_shaders${assignmentName}`;
    }
    assignmentName = assignmentName.replace(/(\.|-)/g, "_");
    contents += `export { default as ${assignmentName} } from './${moduleId}.js';${EOL}`;
  });

  await writeFile(`packages/${workspace}/index.js`, contents, {
    encoding: "utf-8",
  });

  return contents;
}

/**
 * Creates a single entry point file by importing all individual spec files.
 */
async function createSpecListForWorkspace(
  files: string[],
  workspace: string,
  outputPath: string,
): Promise<string> {
  let contents = "";
  files.forEach(function (file) {
    contents += `import './${filePathToModuleId(file).replace(
      `packages/${workspace}/Specs/`,
      "",
    )}.js';\n`;
  });

  await writeFile(outputPath, contents, {
    encoding: "utf-8",
  });

  return contents;
}

interface BundleCSSOptions {
  filePaths: string[];
  sourcemap?: boolean;
  minify?: boolean;
  outdir: string;
  outbase?: string;
}

/**
 * Bundles CSS files.
 */
async function bundleCSS(options: BundleCSSOptions): Promise<void> {
  // Configure options for esbuild.
  const esBuildOptions: BuildOptions = {
    ...defaultESBuildOptions(),
    entryPoints: await globby(options.filePaths),
    loader: {
      ".gif": "text",
      ".png": "text",
    },
    sourcemap: options.sourcemap,
    minify: options.minify,
    outdir: options.outdir,
    outbase: options.outbase,
  };

  await esbuild.build(esBuildOptions);
}

const workspaceCssFiles: WorkspaceGlobs = {
  engine: ["packages/engine/Source/**/*.css"],
  widgets: ["packages/widgets/Source/**/*.css"],
};

interface WorkspaceBundleSpecsOptions {
  incremental?: boolean;
  outbase: string;
  outdir: string;
  specListFile: string;
  write?: boolean;
}

/**
 * Bundles spec files for testing in the browser.
 */
async function bundleSpecs(
  options: WorkspaceBundleSpecsOptions,
): Promise<BuildContext | BuildResult> {
  const incremental = options.incremental ?? true;
  const write = options.write ?? true;

  const buildOptions: BuildOptions = {
    bundle: true,
    format: "esm",
    outdir: options.outdir,
    sourcemap: true,
    target: "es2020",
    write: write,
  };

  const build = incremental ? esbuild.context : esbuild.build;

  // When bundling specs for a workspace, the spec-main.js and karma-main.js
  // are bundled separately since they use a different outbase than the workspace's SpecList.js.
  await build({
    ...buildOptions,
    entryPoints: ["Specs/spec-main.js", "Specs/karma-main.js"],
  });

  return build({
    ...buildOptions,
    entryPoints: [options.specListFile],
    outbase: options.outbase,
  });
}

interface WorkspaceBuildOptions {
  incremental?: boolean;
  minify?: boolean;
  write?: boolean;
}

/**
 * Builds the engine workspace.
 */
export const buildEngine = async (
  options?: WorkspaceBuildOptions,
): Promise<IndexJsContexts> => {
  options = options || {};

  const incremental = options.incremental ?? false;
  const minify = options.minify ?? false;
  const write = options.write ?? true;

  // Create Build folder to place build artifacts.
  mkdirp.sync("packages/engine/Build");

  // Convert GLSL files to JavaScript modules.
  await glslToJavaScript(
    minify,
    "packages/engine/Build/minifyShaders.state",
    "engine",
  );

  // Create index.js
  await createIndexJs("engine");

  const contexts = await bundleIndexJs({
    minify: minify,
    incremental: incremental,
    sourcemap: true,
    removePragmas: false,
    outputDirectory: path.join(
      `packages/engine/Build`,
      `${!minify ? "Unminified" : "Minified"}`,
    ),
    write: write,
    entryPoint: `packages/engine/index.js`,
  });

  // Build workers.
  await bundleWorkers({
    ...options,
    iife: false,
    path: "packages/engine/Build",
  });

  // Create SpecList.js
  const specFiles = await globby(workspaceSpecFiles["engine"]!);
  const specListFile = path.join("packages/engine/Specs", "SpecList.js");
  await createSpecListForWorkspace(specFiles, "engine", specListFile);

  await bundleSpecs({
    incremental: incremental,
    outbase: "packages/engine/Specs",
    outdir: "packages/engine/Build/Specs",
    specListFile: specListFile,
    write: write,
  });

  return contexts;
};

/**
 * Builds the widgets workspace.
 */
export const buildWidgets = async (
  options?: WorkspaceBuildOptions,
): Promise<IndexJsContexts> => {
  options = options || {};

  const incremental = options.incremental ?? false;
  const minify = options.minify ?? false;
  const write = options.write ?? true;

  // Generate Build folder to place build artifacts.
  mkdirp.sync("packages/widgets/Build");

  // Create index.js
  await createIndexJs("widgets");

  const contexts = await bundleIndexJs({
    minify: minify,
    incremental: incremental,
    sourcemap: true,
    removePragmas: false,
    outputDirectory: path.join(
      `packages/widgets/Build`,
      `${!minify ? "Unminified" : "Minified"}`,
    ),
    write: write,
    entryPoint: `packages/widgets/index.js`,
  });

  // Create SpecList.js
  const specFiles = await globby(workspaceSpecFiles["widgets"]!);
  const specListFile = path.join("packages/widgets/Specs", "SpecList.js");
  await createSpecListForWorkspace(specFiles, "widgets", specListFile);

  await bundleSpecs({
    incremental: incremental,
    outbase: "packages/widgets/Specs",
    outdir: "packages/widgets/Build/Specs",
    specListFile: specListFile,
    write: write,
  });

  return contexts;
};

interface BuildCesiumOptions {
  development?: boolean;
  iife?: boolean;
  incremental?: boolean;
  minify?: boolean;
  node?: boolean;
  outputDirectory?: string;
  removePragmas?: boolean;
  sourcemap?: boolean;
  write?: boolean;
}

interface BuildCesiumContexts {
  esm?: BuildContext | BuildResult;
  iife?: BuildContext | BuildResult;
  iifeWorkers?: BuildContext | BuildResult | void;
  node?: BuildContext | BuildResult;
  specs?: BuildContext | BuildResult;
  workers?: BuildContext | BuildResult | void;
  testWorkers?: BuildContext | BuildResult;
}

/**
 * Build CesiumJS.
 */
export async function buildCesium(
  options: BuildCesiumOptions,
): Promise<BuildCesiumContexts> {
  const development = options.development ?? true;
  const iife = options.iife ?? true;
  const incremental = options.incremental ?? false;
  const minify = options.minify ?? false;
  const node = options.node ?? true;
  const removePragmas = options.removePragmas ?? false;
  const sourcemap = options.sourcemap ?? true;
  const write = options.write ?? true;

  // Generate Build folder to place build artifacts.
  mkdirp.sync("Build");
  const outputDirectory =
    options.outputDirectory ??
    path.join("Build", `Cesium${!minify ? "Unminified" : ""}`);
  rimraf.sync(outputDirectory);

  await writeFile(
    "Build/package.json",
    JSON.stringify({
      type: "commonjs",
    }),
    "utf8",
  );

  // Create Cesium.js
  await createCesiumJs();

  // Create SpecList.js
  await createCombinedSpecList();

  // Bundle ThirdParty files.
  await bundleCSS({
    filePaths: [
      "packages/engine/Source/ThirdParty/google-earth-dbroot-parser.js",
    ],
    minify: minify,
    sourcemap: sourcemap,
    outdir: outputDirectory,
    outbase: "packages/engine/Source",
  });

  // Bundle CSS files.
  await bundleCSS({
    filePaths: workspaceCssFiles[`engine`]!,
    outdir: path.join(outputDirectory, "Widgets/CesiumWidget"),
    outbase: "packages/engine/Source/Widget",
  });
  await bundleCSS({
    filePaths: workspaceCssFiles[`widgets`]!,
    outdir: path.join(outputDirectory, "Widgets"),
    outbase: "packages/widgets/Source",
  });

  const workersContext = await bundleWorkers({
    iife: false,
    minify: minify,
    sourcemap: sourcemap,
    path: outputDirectory,
    removePragmas: removePragmas,
    incremental: incremental,
    write: write,
  });

  // Generate bundles.
  const contexts = await bundleCesiumJs({
    minify: minify,
    iife: iife,
    incremental: incremental,
    sourcemap: sourcemap,
    removePragmas: removePragmas,
    path: outputDirectory,
    node: node,
    write: write,
  });

  await Promise.all([createJsHintOptions(), createGalleryList(!development)]);

  // Generate Specs bundle.
  const specsContext = await bundleCombinedSpecs({
    incremental: incremental,
    write: write,
  });

  const testWorkersContext = await bundleTestWorkers({
    incremental: incremental,
    write: write,
  });

  // Copy static assets to the Build folder.

  await copyEngineAssets(outputDirectory);
  await copyWidgetsAssets(path.join(outputDirectory, "Widgets"));

  // Copy static assets to Source folder.

  await copyEngineAssets("Source");
  await copyFiles(
    ["packages/engine/Source/ThirdParty/**/*.js"],
    "Source/ThirdParty",
    "packages/engine/Source/ThirdParty",
  );

  await copyWidgetsAssets("Source/Widgets");
  await copyFiles(
    ["packages/widgets/Source/**/*.css"],
    "Source/Widgets",
    "packages/widgets/Source",
  );

  // WORKAROUND:
  // Since CesiumWidget was originally part of the Widgets folder, we need to fix up any
  // references to it when we put it back in the Widgets folder, as expected by the
  // combined CesiumJS structure.
  const widgetsCssBuffer = await readFile("Source/Widgets/widgets.css");
  const widgetsCssContents = widgetsCssBuffer
    .toString()
    .replace("../../engine/Source/Widget", "./CesiumWidget");
  await writeFile("Source/Widgets/widgets.css", widgetsCssContents);

  const lighterCssBuffer = await readFile("Source/Widgets/lighter.css");
  const lighterCssContents = lighterCssBuffer
    .toString()
    .replace("../../engine/Source/Widget", "./CesiumWidget");
  await writeFile("Source/Widgets/lighter.css", lighterCssContents);

  return {
    esm: contexts.esm,
    iife: contexts.iife,
    iifeWorkers: contexts.iifeWorkers,
    node: contexts.node,
    specs: specsContext,
    workers: workersContext,
    testWorkers: testWorkersContext,
  };
}
