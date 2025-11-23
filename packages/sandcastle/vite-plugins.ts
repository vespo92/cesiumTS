import { basename } from "path";
import type { PluginOption, UserConfig, IndexHtmlTransformContext } from "vite";

/**
 * Replace path values in
 */
export const cesiumPathReplace = (cesiumBaseUrl: string): PluginOption => {
  return {
    name: "custom-cesium-path-plugin",
    config(config: UserConfig) {
      config.define = {
        ...config.define,
        __CESIUM_BASE_URL__: JSON.stringify(cesiumBaseUrl),
      };
    },
    transformIndexHtml(html: string) {
      return html.replaceAll("__CESIUM_BASE_URL__", `${cesiumBaseUrl}`);
    },
  };
};

/**
 * Specify an import map for the built html files
 */
export const insertImportMap = (
  imports: Record<string, string>,
  filenames: string[] = ["bucket.html", "standalone.html"],
): PluginOption => {
  return {
    name: "custom-import-map",
    transformIndexHtml: {
      order: "pre" as const,
      handler(html: string, ctx: IndexHtmlTransformContext) {
        if (
          filenames.length > 0 &&
          !filenames.includes(basename(ctx.filename))
        ) {
          return;
        }
        return {
          html,
          tags: [
            {
              tag: "script",
              attrs: {
                type: "importmap",
              },
              children: JSON.stringify({ imports }, null, 2),
              injectTo: "head-prepend" as const,
            },
          ],
        };
      },
    },
  };
};
