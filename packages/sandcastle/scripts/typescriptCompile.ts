import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Compile a typescript project from it's config file using the tsc CLI
 *
 * @param configPath Absolute path to the config file to build
 * @returns exit code from the tsc command
 */
export default async function typescriptCompile(
  configPath: string,
): Promise<number> {
  const tsPath = import.meta.resolve("typescript");
  const binPath = fileURLToPath(join(tsPath, "../../bin/tsc"));
  return new Promise((resolve, reject) => {
    const ls = spawn(binPath, ["-p", configPath]);

    ls.stdout.on("data", (data: Buffer) => {
      console.log(`stdout: ${data}`);
    });

    ls.stderr.on("data", (data: Buffer) => {
      console.error(`stderr: ${data}`);
    });

    ls.on("close", (code: number | null) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
}
