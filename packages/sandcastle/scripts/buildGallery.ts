import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { exit } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { rimraf } from "rimraf";
import { parse } from "yaml";
import { globby } from "globby";
import * as pagefind from "pagefind";

import createGalleryRecord from "./createGalleryRecord.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultRootDirectory = join(__dirname, "..");
const defaultPublicDirectory = "./public";
const defaultGalleryFiles = ["gallery"];
const defaultThumbnailPath = "images/placeholder-thumbnail.jpg";
const requiredMetadataKeys = ["title", "description"];
const galleryItemConfig = /sandcastle\.(yml|yaml)/;

interface PagefindIndex {
  addHTMLFile: (args: { url: string; content: string }) => Promise<unknown>;
  writeFiles: (args: { outputPath: string }) => Promise<unknown>;
}

async function createPagefindIndex(): Promise<PagefindIndex> {
  try {
    const { index } = await pagefind.createIndex({
      verbose: true,
      logfile: join(__dirname, "pagefind-debug.log"),
    });

    if (!index) {
      throw new Error("Missing index output.");
    }

    return index as unknown as PagefindIndex;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Could not create search index. ${err.message}`);
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

type GalleryFilter = Record<string, string | string[]> | null;

interface GalleryListItem {
  url: string;
  id: string;
  title: string;
  thumbnail: string;
  sourceUrl: string;
  lineCount: number;
  description: string;
  labels: string[];
}

interface GalleryList {
  entries: GalleryListItem[];
  legacyIds: Record<string, string>;
  searchOptions: Record<string, unknown>;
  defaultFilters: GalleryFilter;
}

interface BuildGalleryOptions {
  rootDirectory?: string;
  publicDirectory?: string;
  galleryFiles?: string[];
  sourceUrl?: string;
  defaultThumbnail?: string;
  searchOptions?: Record<string, unknown>;
  defaultFilters?: GalleryFilter;
  metadata?: Record<string, unknown>;
  includeDevelopment?: boolean;
}

export async function buildGalleryList(
  options: BuildGalleryOptions = {},
): Promise<GalleryList> {
  const rootDirectory = options.rootDirectory ?? defaultRootDirectory;
  const publicDirectory = options.publicDirectory ?? defaultPublicDirectory;
  const galleryFilesPattern = options.galleryFiles ?? defaultGalleryFiles;
  const sourceUrl = options.sourceUrl ?? "";
  const defaultThumbnail = options.defaultThumbnail ?? defaultThumbnailPath;
  const searchOptions = options.searchOptions ?? {};
  const defaultFilters = options.defaultFilters ?? null;
  const metadataKeys = options.metadata ?? {};
  const includeDevelopment = options.includeDevelopment ?? true;

  const pagefindIndex = await createPagefindIndex();

  const output: GalleryList = {
    entries: [],
    legacyIds: {},
    searchOptions,
    defaultFilters,
  };

  const errors: Error[] = [];
  const check = (condition: boolean, messageIfTrue: string): boolean => {
    if (condition) {
      errors.push(new Error(messageIfTrue));
    }
    return condition;
  };

  const galleryFiles = await globby(
    galleryFilesPattern.map((pattern: string) =>
      join(rootDirectory, pattern, "**/*"),
    ),
  );
  const yamlFiles = galleryFiles.filter((path: string) =>
    basename(path).match(galleryItemConfig),
  );

  for (const filePath of yamlFiles) {
    let metadata: Record<string, unknown> | undefined;

    try {
      const file = await readFile(filePath, "utf-8");
      metadata = parse(file) as Record<string, unknown> | undefined;
    } catch (error) {
      const err = error as Error;
      errors.push(
        new Error(`Could not read file "${filePath}: ${err.message}`),
      );
      continue;
    }

    const expectedKeys = [
      ...requiredMetadataKeys,
      "thumbnail",
      ...Object.keys(metadataKeys),
    ];

    if (!metadata) {
      errors.push(
        new Error(
          `File "${filePath}" is missing keys "${expectedKeys.join(`", "`)}"`,
        ),
      );
      continue;
    }

    // Check that all keys in a yaml file are values we expect
    for (const key of Object.keys(metadata)) {
      if (!expectedKeys.includes(key)) {
        errors.push(
          new Error(`File "${filePath}" has unexpected key "${key}"`),
        );
      }
    }

    const galleryDirectory = dirname(filePath);
    const slug = basename(galleryDirectory);
    const relativePath = relative(rootDirectory, galleryDirectory);
    const galleryBase = join(rootDirectory, relativePath);

    const { title, description, legacyId, thumbnail, labels, development } =
      metadata as {
        title?: string;
        description?: string;
        legacyId?: string;
        thumbnail?: string;
        labels?: string[];
        development?: boolean;
      };

    const labelsArray = labels ?? [];

    // Validate metadata

    if (
      check(!/^[a-zA-Z0-9-.]+$/.test(slug), `"${slug}" is not a valid slug`) ||
      check(!title, `${slug} - Missing title`) ||
      check(!description, `${slug} - Missing description`) ||
      check(
        !development && labelsArray.includes("Development"),
        `${slug} has Development label but not marked as development sandcastle`,
      )
    ) {
      continue;
    }

    const indexHtml = join(galleryBase, "index.html");
    const hasIndexHtml = await exists(indexHtml);
    if (!hasIndexHtml) {
      errors.push(new Error(`Missing "${indexHtml}"`));
    }

    const indexJs = join(galleryBase, "main.js");
    const hasIndexJs = await exists(indexJs);
    if (!hasIndexJs) {
      errors.push(new Error(`Missing "${indexJs}"`));
    }

    const thumbnailImage = thumbnail
      ? join(relativePath, thumbnail)
      : defaultThumbnail;
    const hasThumbnail =
      !thumbnail || (await exists(join(rootDirectory, thumbnailImage)));
    if (!hasThumbnail) {
      errors.push(new Error(`Missing "${thumbnailImage}"`));
    }

    if (
      !hasIndexHtml ||
      !hasIndexJs ||
      !hasThumbnail ||
      (development && !includeDevelopment)
    ) {
      continue;
    }

    if (development && !labelsArray.includes("Development")) {
      labelsArray.push("Development");
    }

    if (legacyId) {
      output.legacyIds[legacyId] = slug;
    }

    try {
      const jsFile = await readFile(indexJs, "utf-8");
      const lineCount = jsFile.split("\n").length;
      const editSourceUrl = join(sourceUrl, relativePath);

      output.entries.push({
        url: relativePath,
        id: slug,
        title: title!,
        thumbnail: thumbnailImage,
        sourceUrl: editSourceUrl,
        lineCount: lineCount,
        description: description!,
        labels: labelsArray,
      });

      await pagefindIndex.addHTMLFile(
        createGalleryRecord({
          id: slug,
          code: jsFile,
          title: title!,
          description: description!,
          image: thumbnailImage,
          labels: labelsArray,
        }),
      );
    } catch (error) {
      const err = error as Error;
      errors.push(
        new Error(
          `Could not build gallery record for "${filePath}": ${err.message}`,
        ),
      );
      continue;
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, "Could not build gallery list");
  }

  // Sort alphabetically so the default sort order when loaded is alphabetical,
  // regardless of if titles match the directory names
  output.entries.sort((a, b) => a.title.localeCompare(b.title));

  const outputDirectory = join(rootDirectory, publicDirectory, "gallery");
  await rimraf(outputDirectory);
  await mkdir(outputDirectory, { recursive: true });

  await writeFile(join(outputDirectory, "list.json"), JSON.stringify(output));

  await pagefindIndex.writeFiles({
    outputPath: join(outputDirectory, "pagefind"),
  });

  // Copy all static gallery files
  const staticGalleryFiles = galleryFiles.filter(
    (path: string) => !basename(path).match(galleryItemConfig),
  );
  try {
    for (const file of staticGalleryFiles) {
      const destination = join(
        rootDirectory,
        publicDirectory,
        relative(rootDirectory, file),
      );
      await cp(file, destination, { recursive: true });
    }
  } catch (error) {
    const err = error as Error;
    console.error(`Error copying gallery files: ${err.message}`);
  }

  return output;
}

// If running the script directly using node
if (import.meta.url.endsWith(`${pathToFileURL(process.argv[1]!)}`)) {
  const argv = (await yargs(hideBin(process.argv)).parse()) as {
    config?: string;
  };

  const configPath = argv.config ?? join(__dirname, "../sandcastle.config.js");
  let buildGalleryOptions: BuildGalleryOptions;

  try {
    const config = await import(pathToFileURL(configPath).href);
    const { root, publicDirectory, gallery, sourceUrl } = config.default;

    // Paths are specified relative to the config file
    const configDir = dirname(configPath);
    const configRoot = root ? join(configDir, root) : configDir;
    const {
      files,
      includeDevelopment,
      defaultThumbnail,
      searchOptions,
      defaultFilters,
      metadata,
    } = gallery ?? {};

    buildGalleryOptions = {
      rootDirectory: configRoot,
      publicDirectory: publicDirectory,
      galleryFiles: files,
      sourceUrl,
      defaultThumbnail,
      searchOptions,
      defaultFilters,
      metadata,
      includeDevelopment,
    };
  } catch (error) {
    const err = error as Error;
    console.error(`Could not read config file: ${err.message}`, {
      cause: error,
    });
    exit(1);
  }

  let output: GalleryList | undefined;
  try {
    output = await buildGalleryList(buildGalleryOptions);
    console.log("Successfully built gallery list.");
  } catch (error) {
    console.error(error);
    exit(1);
  }

  if (output) {
    console.log(`Processed ${output.entries.length} gallery examples.`);
  }
}
