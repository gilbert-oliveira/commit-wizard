import type { Config } from '../config/index';
import type { CLIArgs } from '../utils/args';
export interface FileGroup {
    id: string;
    name: string;
    description: string;
    files: string[];
    diff: string;
    confidence: number;
}
export interface SmartSplitResult {
    success: boolean;
    groups?: FileGroup[];
    error?: string;
}
/**
 * Analisa o contexto dos arquivos usando IA
 */
export declare function analyzeFileContext(files: string[], overallDiff: string, config: Config): Promise<SmartSplitResult>;
/**
 * Gera diff para um grupo de arquivos (otimizado para tokens)
 */
export declare function generateGroupDiff(group: FileGroup): Promise<string>;
/**
 * Executa o smart split mode
 */
export declare function handleSmartSplitMode(gitStatus: any, config: Config, args: CLIArgs): Promise<void>;
//# sourceMappingURL=smart-split.d.ts.map