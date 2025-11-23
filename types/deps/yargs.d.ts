declare module "yargs" {
  interface Argv<T = {}> {
    option<K extends string, O extends Options>(
      key: K,
      options: O
    ): Argv<T & { [key in K]: InferredOptionType<O> }>;
    options<O extends { [key: string]: Options }>(
      options: O
    ): Argv<T & InferredOptionTypes<O>>;
    positional<K extends string, O extends PositionalOptions>(
      key: K,
      options: O
    ): Argv<T & { [key in K]: InferredOptionType<O> }>;
    alias(shortName: string | string[], longName: string | string[]): Argv<T>;
    array<K extends keyof T>(key: K | K[]): Argv<T>;
    boolean<K extends keyof T>(key: K | K[]): Argv<T>;
    check(func: (argv: Arguments<T>, aliases: { [alias: string]: string }) => any, global?: boolean): Argv<T>;
    choices<K extends keyof T, C extends ReadonlyArray<any>>(key: K, values: C): Argv<T>;
    coerce<K extends keyof T, V>(key: K | K[], func: (arg: any) => V): Argv<T>;
    command<U>(
      command: string | string[],
      description: string,
      builder?: (args: Argv<T>) => Argv<U>,
      handler?: (args: Arguments<U>) => void
    ): Argv<T>;
    config(key?: string | string[], description?: string, parseFn?: (configPath: string) => object): Argv<T>;
    conflicts(key: string, value: string | string[]): Argv<T>;
    count<K extends keyof T>(key: K | K[]): Argv<T>;
    default<K extends keyof T, V>(key: K, value: V, description?: string): Argv<T>;
    demand<K extends keyof T>(key: K | K[] | number, msg?: string | boolean): Argv<T>;
    demandOption<K extends keyof T>(key: K | K[], msg?: string | boolean): Argv<T>;
    demandOption<K extends keyof T>(key: K | K[], demand?: boolean): Argv<T>;
    deprecateOption(option: string, msg?: string): Argv<T>;
    describe<K extends keyof T>(key: K | K[], description: string): Argv<T>;
    detectLocale(detect: boolean): Argv<T>;
    env(prefix?: string | false): Argv<T>;
    epilog(msg: string): Argv<T>;
    epilogue(msg: string): Argv<T>;
    example(command: string, description: string): Argv<T>;
    example(examples: ReadonlyArray<[string, string?]>): Argv<T>;
    exit(code: number, err: Error): void;
    exitProcess(enabled?: boolean): Argv<T>;
    fail(func: ((msg: string, err: Error, yargs: Argv<T>) => any) | boolean): Argv<T>;
    getCompletion(args: string[], done: (completions: string[]) => void): void;
    global<K extends keyof T>(key: K | K[]): Argv<T>;
    group<K extends keyof T>(key: K | K[], groupName: string): Argv<T>;
    help(): Argv<T>;
    help(enableExplicit: boolean): Argv<T>;
    help(option: string, enableExplicit: boolean): Argv<T>;
    help(option: string, description?: string, enableExplicit?: boolean): Argv<T>;
    hide<K extends keyof T>(key: K): Argv<T>;
    implies(key: string, value: string | string[]): Argv<T>;
    locale(): string;
    locale(loc: string): Argv<T>;
    middleware(
      callbacks: MiddlewareFunction<T> | ReadonlyArray<MiddlewareFunction<T>>,
      applyBeforeValidation?: boolean
    ): Argv<T>;
    nargs<K extends keyof T>(key: K, count: number): Argv<T>;
    normalize<K extends keyof T>(key: K | K[]): Argv<T>;
    number<K extends keyof T>(key: K | K[]): Argv<T>;
    onFinishCommand(func: (result: any) => void): Argv<T>;
    parse(): Promise<T>;
    parse(args: string | string[]): Promise<T>;
    parse(args: string | string[], context: object): Promise<T>;
    parse(args: string | string[], parseCallback: ParseCallback<T>): Promise<T>;
    parse(args: string | string[], context: object, parseCallback: ParseCallback<T>): Promise<T>;
    parseAsync(): Promise<T>;
    parseAsync(args: string | string[]): Promise<T>;
    parseAsync(args: string | string[], context: object): Promise<T>;
    parseAsync(args: string | string[], parseCallback: ParseCallback<T>): Promise<T>;
    parseAsync(args: string | string[], context: object, parseCallback: ParseCallback<T>): Promise<T>;
    parseSync(): T;
    parseSync(args: string | string[]): T;
    parseSync(args: string | string[], context: object): T;
    parseSync(args: string | string[], parseCallback: ParseCallback<T>): T;
    parseSync(args: string | string[], context: object, parseCallback: ParseCallback<T>): T;
    parserConfiguration(configuration: Partial<ParserConfigurationOptions>): Argv<T>;
    pkgConf(key: string, cwd?: string): Argv<T>;
    positional<K extends string, O extends PositionalOptions>(key: K, opt: O): Argv<T>;
    recommendCommands(): Argv<T>;
    require<K extends keyof T>(key: K | K[], msg?: string | boolean): Argv<T>;
    required<K extends keyof T>(key: K | K[], msg?: string | boolean): Argv<T>;
    requiresArg<K extends keyof T>(key: K | K[]): Argv<T>;
    scriptName(name: string): Argv<T>;
    showCompletionScript(command?: string, description?: string): Argv<T>;
    showHelp(consoleLevel?: string): Argv<T>;
    showHelpOnFail(enable: boolean, message?: string): Argv<T>;
    showHidden(show?: boolean): Argv<T>;
    showHidden(option: string, description?: string): Argv<T>;
    skipValidation<K extends keyof T>(key: K | K[]): Argv<T>;
    strict(enabled?: boolean): Argv<T>;
    strictCommands(enabled?: boolean): Argv<T>;
    strictOptions(enabled?: boolean): Argv<T>;
    string<K extends keyof T>(key: K | K[]): Argv<T>;
    terminalWidth(): number;
    updateLocale(obj: { [key: string]: string }): Argv<T>;
    updateStrings(obj: { [key: string]: string }): Argv<T>;
    usage(message: string): Argv<T>;
    usage(command: string | string[], description: string, builder?: (args: Argv<T>) => Argv<any>, handler?: (args: Arguments<any>) => void): Argv<T>;
    version(): Argv<T>;
    version(version: string): Argv<T>;
    version(enable: boolean): Argv<T>;
    version(option: string, version: string): Argv<T>;
    version(option: string, description: string, version: string): Argv<T>;
    wrap(columns: number | null): Argv<T>;
    argv: T;
  }

  interface Arguments<T = {}> {
    _: (string | number)[];
    $0: string;
    [key: string]: unknown;
  }

  interface Options {
    alias?: string | string[];
    array?: boolean;
    boolean?: boolean;
    choices?: ReadonlyArray<any>;
    coerce?: (arg: any) => any;
    config?: boolean;
    configParser?: (configPath: string) => object;
    conflicts?: string | string[] | { [key: string]: string | string[] };
    count?: boolean;
    default?: any;
    defaultDescription?: string;
    demandOption?: boolean | string;
    deprecate?: boolean | string;
    deprecated?: boolean | string;
    desc?: string;
    describe?: string;
    description?: string;
    global?: boolean;
    group?: string;
    hidden?: boolean;
    implies?: string | string[] | { [key: string]: string | string[] };
    nargs?: number;
    normalize?: boolean;
    number?: boolean;
    require?: boolean | string;
    required?: boolean | string;
    requiresArg?: boolean;
    skipValidation?: boolean;
    string?: boolean;
    type?: "array" | "boolean" | "count" | "number" | "string";
  }

  interface PositionalOptions {
    alias?: string | string[];
    array?: boolean;
    choices?: ReadonlyArray<any>;
    coerce?: (arg: any) => any;
    conflicts?: string | string[] | { [key: string]: string | string[] };
    default?: any;
    defaultDescription?: string;
    demandOption?: boolean | string;
    desc?: string;
    describe?: string;
    description?: string;
    implies?: string | string[] | { [key: string]: string | string[] };
    normalize?: boolean;
    type?: "boolean" | "number" | "string";
  }

  interface ParserConfigurationOptions {
    "boolean-negation"?: boolean;
    "camel-case-expansion"?: boolean;
    "combine-arrays"?: boolean;
    "dot-notation"?: boolean;
    "duplicate-arguments-array"?: boolean;
    "flatten-duplicate-arrays"?: boolean;
    "greedy-arrays"?: boolean;
    "halt-at-non-option"?: boolean;
    "nargs-eats-options"?: boolean;
    "negation-prefix"?: string;
    "parse-numbers"?: boolean;
    "parse-positional-numbers"?: boolean;
    "populate--"?: boolean;
    "set-placeholder-key"?: boolean;
    "short-option-groups"?: boolean;
    "sort-commands"?: boolean;
    "strip-aliased"?: boolean;
    "strip-dashed"?: boolean;
    "unknown-options-as-args"?: boolean;
  }

  type InferredOptionType<O extends Options | PositionalOptions> = any;
  type InferredOptionTypes<O extends { [key: string]: Options }> = { [key in keyof O]: any };
  type MiddlewareFunction<T = {}> = (argv: Arguments<T>) => void | Promise<void>;
  type ParseCallback<T = {}> = (err: Error | undefined, argv: Arguments<T>, output: string) => void;

  function yargs(processArgs?: string | string[]): Argv;
  function yargs(processArgs?: string | string[], cwd?: string): Argv;

  export = yargs;
}

declare module "yargs/helpers" {
  export function hideBin(argv: string[]): string[];
  export function Parser(): any;
  export function applyExtends(config: object, cwd?: string, mergeExtends?: boolean): object;
}
