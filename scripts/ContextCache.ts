import type { BuildContext, BuildResult, BuildOptions } from "esbuild";

class ContextCache<T extends BuildOptions = BuildOptions> {
  private context: BuildContext<T>;
  private promise: Promise<BuildResult<T>>;
  private result: BuildResult<T> | undefined;

  constructor(context: BuildContext<T>) {
    this.context = context;
    this.promise = Promise.resolve() as unknown as Promise<BuildResult<T>>;
    this.result = undefined;
  }

  clear(): void {
    this.result = undefined;
  }

  async rebuild(): Promise<BuildResult<T>> {
    const promise = (this.promise = this.context.rebuild());
    const result = (this.result = await promise);
    return result;
  }

  isBuilt(): boolean {
    return !!(
      this.result &&
      this.result.outputFiles &&
      this.result.outputFiles.length > 0
    );
  }
}

export default ContextCache;
