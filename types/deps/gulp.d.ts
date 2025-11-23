declare module "gulp" {
  import { Transform } from "stream";

  interface SrcOptions {
    base?: string;
    buffer?: boolean;
    cwd?: string;
    encoding?: boolean | BufferEncoding;
    nodir?: boolean;
    read?: boolean;
    since?: Date | number;
    dot?: boolean;
    allowEmpty?: boolean;
  }

  interface DestOptions {
    cwd?: string;
    mode?: number | string;
    dirMode?: number | string;
    overwrite?: boolean;
  }

  interface Gulp {
    src(globs: string | string[], options?: SrcOptions): Transform;
    dest(directory: string, options?: DestOptions): Transform;
    watch(globs: string | string[], fn?: Function): any;
    task(name: string, fn?: Function): void;
    series(...tasks: Array<string | Function>): Function;
    parallel(...tasks: Array<string | Function>): Function;
    lastRun(taskName: string, timeResolution?: number): number | undefined;
    tree(options?: { deep?: boolean }): any;
    registry(registry?: any): any;
  }

  const gulp: Gulp;
  export = gulp;
}
