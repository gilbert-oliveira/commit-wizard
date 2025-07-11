export interface Config {
    openai: {
        model: string;
        maxTokens: number;
        temperature: number;
        apiKey?: string;
        timeout: number;
        retries: number;
    };
    language: string;
    commitStyle: 'conventional' | 'simple' | 'detailed';
    autoCommit: boolean;
    splitCommits: boolean;
    dryRun: boolean;
    smartSplit: {
        enabled: boolean;
        minGroupSize: number;
        maxGroups: number;
        confidenceThreshold: number;
    };
    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
    };
}
export declare function loadConfig(configPath?: string): Config;
export declare function validateConfig(config: Config): string[];
/**
 * Cria um arquivo de configuração exemplo
 */
export declare function createExampleConfig(path?: string): void;
//# sourceMappingURL=index.d.ts.map