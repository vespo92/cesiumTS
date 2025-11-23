import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { getVersion } from "./build.js";
import {
  buildStatic,
  createSandcastleConfig,
} from "../packages/sandcastle/scripts/buildStatic.js";
import { buildGalleryList } from "../packages/sandcastle/scripts/buildGallery.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

interface SandcastleConfigOptions {
  configPath: string;
  root?: string;
  gallery?: {
    files?: string[];
    defaultThumbnail?: string;
    searchOptions?: Record<string, unknown>;
    defaultFilters?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
  sourceUrl?: string;
  [key: string]: unknown;
}

/**
 * Parses Sandcastle config file and returns its values.
 */
export async function getSandcastleConfig(): Promise<SandcastleConfigOptions> {
  const configPath = "packages/sandcastle/sandcastle.config.js";
  const configImportPath = join(projectRoot, configPath);
  const config = await import(pathToFileURL(configImportPath).href);
  const options = config.default;
  return {
    ...options,
    configPath,
  };
}

interface BuildSandcastleAppOptions {
  outputToBuildDir?: boolean;
  includeDevelopment?: boolean;
}

/**
 * Build the Sandcastle package out to static files in the repo for use in the local server
 * or deployments.
 *
 * If `outputToBuildDir` is true then all necessary static files for CesiumJS and assets
 * will be bundled with the sandcastle files in Build/Sandcastle2. Used to make deployments easier
 *
 * If `outputToBuildDir` is false then sandcastle will be built to Apps/Sandcastle2 with
 * relative paths to other top level cesium assets and built files. Used for local development and the zip file
 */
export async function buildSandcastleApp({
  outputToBuildDir,
  includeDevelopment,
}: BuildSandcastleAppOptions): Promise<void> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const version = await getVersion();
  let config;
  if (outputToBuildDir) {
    const cesiumSource = join(__dirname, "../Build/CesiumUnminified");
    const cesiumBaseUrl = "Build/CesiumUnminified";

    config = createSandcastleConfig({
      outDir: join(__dirname, "../Build/Sandcastle2"),
      basePath: "./",
      cesiumBaseUrl: "/Build/CesiumUnminified",
      cesiumVersion: version,
      imports: {
        cesium: {
          path: "/js/Cesium.js",
          typesPath: "/js/Cesium.d.ts",
        },
        "@cesium/engine": {
          path: "/js/engine/index.js",
          typesPath: "/js/engine/index.d.ts",
        },
        "@cesium/widgets": {
          path: "/js/widgets/index.js",
          typesPath: "/js/widgets/index.d.ts",
        },
      },
      copyExtraFiles: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/*.(js|cjs)`, dest: cesiumBaseUrl },
        { src: join(__dirname, "../Apps/SampleData"), dest: "Apps" },
        { src: join(__dirname, "../Apps/SampleData"), dest: "" },
        { src: join(__dirname, "../Source/Cesium.(d.ts|js)"), dest: "js" },
        {
          src: join(__dirname, "../packages/engine/index.d.ts"),
          dest: "js/engine",
        },
        {
          src: join(__dirname, "../packages/engine/Build/Unminified/index.js"),
          dest: "js/engine",
        },
        {
          src: join(__dirname, "../packages/widgets/index.d.ts"),
          dest: "js/widgets",
        },
        {
          src: join(__dirname, "../packages/widgets/Build/Unminified/index.js"),
          dest: "js/widgets",
        },
      ],
    });
  } else {
    config = createSandcastleConfig({
      outDir: join(__dirname, "../Apps/Sandcastle2"),
      basePath: "./",
      cesiumBaseUrl: "../../../Build/CesiumUnminified",
      cesiumVersion: version,
      commitSha: JSON.stringify(process.env.GITHUB_SHA ?? undefined),
      imports: {
        cesium: {
          path: "../../../Source/Cesium.js",
          typesPath: "../../../Source/Cesium.d.ts",
        },
        "@cesium/engine": {
          path: "../../../packages/engine/Build/Unminified/index.js",
          typesPath: "../../../packages/engine/index.d.ts",
        },
        "@cesium/widgets": {
          path: "../../../packages/widgets/Build/Unminified/index.js",
          typesPath: "../../../packages/widgets/index.d.ts",
        },
      },
    });
  }

  await buildStatic(config);
  // Build the gallery after sandcastle to avoid clobbering the files
  await buildSandcastleGallery({
    includeDevelopment,
    outputDir: outputToBuildDir
      ? "../../Build/Sandcastle2"
      : "../../Apps/Sandcastle2",
  });
}

interface BuildSandcastleGalleryOptions {
  includeDevelopment?: boolean;
  outputDir?: string;
}

/**
 * Indexes Sandcastle gallery files and writes gallery files to the configured Sandcastle output directory.
 */
export async function buildSandcastleGallery({
  includeDevelopment,
  outputDir = "../../Apps/Sandcastle2",
}: BuildSandcastleGalleryOptions): Promise<void> {
  const { configPath, root, gallery, sourceUrl } = await getSandcastleConfig();

  // Use an absolute path to avoid any discrepancy between working directories
  // All other directories will be relative to the specified root directory
  const rootDirectory = join(dirname(configPath), root ?? ".");

  // Paths are specified relative to the config file
  const {
    files: galleryFiles,
    defaultThumbnail,
    searchOptions,
    defaultFilters,
    metadata,
  } = gallery ?? {};

  await buildGalleryList({
    rootDirectory,
    publicDirectory: outputDir,
    galleryFiles,
    sourceUrl,
    defaultThumbnail,
    searchOptions,
    defaultFilters: defaultFilters as
      | Record<string, string | string[]>
      | undefined,
    metadata,
    includeDevelopment,
  });
}
