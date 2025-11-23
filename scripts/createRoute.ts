import type { BuildResult, BuildContext, OutputFile } from "esbuild";
import type { Application, Request, Response, NextFunction } from "express";
import ContextCache from "./ContextCache.js";
import path from "path";

function formatTimeSinceInSeconds(start: number): number {
  return Math.ceil((performance.now() - start) / 100) / 10;
}

function serveResult(
  result: BuildResult | undefined,
  fileName: string,
  res: Response,
  next: NextFunction,
): void {
  let bundle: string | undefined;
  let error: unknown;
  try {
    if (result?.outputFiles) {
      for (const out of result.outputFiles) {
        if (path.basename(out.path) === fileName) {
          bundle = out.text;
        }
      }
    }
  } catch (e) {
    error = e;
  }

  if (!bundle) {
    next(
      new Error(`Failed to generate bundle: ${fileName}`, {
        cause: error,
      }),
    );
    return;
  }

  res.append("Cache-Control", "max-age=0");
  res.append("Content-Type", "application/javascript");
  res.send(bundle);
}

function createRoute(
  app: Application,
  name: string,
  route: string,
  context: BuildContext,
  dependantCaches?: ContextCache[],
): ContextCache {
  const cache = new ContextCache(context);
  app.get(route, async function (req: Request, res: Response, next: NextFunction) {
    const fileName = path.basename(req.originalUrl);

    // Multiple files may be requested at this path, calling this function in quick succession.
    // Await the previous build before re-building again.
    try {
      await cache.rebuild();
    } catch {
      // Error is reported upstream
    }

    if (!cache.isBuilt()) {
      try {
        const start = performance.now();
        if (dependantCaches) {
          await Promise.all(
            dependantCaches.map((dependantCache) => {
              if (!dependantCache.isBuilt()) {
                return dependantCache.rebuild();
              }
              return Promise.resolve();
            }),
          );
        }
        await cache.rebuild();
        console.log(
          `Built ${name} in ${formatTimeSinceInSeconds(start)} seconds.`,
        );
      } catch (e) {
        next(e);
      }
    }

    const result = await cache.rebuild();
    return serveResult(result, fileName, res, next);
  });

  return cache;
}

export default createRoute;
