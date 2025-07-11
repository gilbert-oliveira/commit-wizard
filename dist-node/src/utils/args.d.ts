export interface CLIArgs {
    silent: boolean;
    yes: boolean;
    auto: boolean;
    split: boolean;
    smartSplit: boolean;
    dryRun: boolean;
    help: boolean;
    version: boolean;
}
export declare function parseArgs(args: string[]): CLIArgs;
export declare function showHelp(): void;
export declare function showVersion(): void;
//# sourceMappingURL=args.d.ts.map