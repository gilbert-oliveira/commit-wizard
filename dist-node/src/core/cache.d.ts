import type { Config } from '../config/index';
import type { FileGroup } from './smart-split';
export interface CacheEntry {
    groups: FileGroup[];
    timestamp: number;
    hash: string;
}
export interface CacheResult {
    hit: boolean;
    groups?: FileGroup[];
}
declare class AnalysisCache {
    private cache;
    private config;
    constructor(config: Config);
    /**
     * Gera hash do contexto para identificar análises similares
     */
    private generateHash;
    /**
     * Verifica se há cache válido para o contexto
     */
    get(files: string[], overallDiff: string): CacheResult;
    /**
     * Armazena resultado no cache
     */
    set(files: string[], overallDiff: string, groups: FileGroup[]): void;
    /**
     * Limpa cache expirado e reduz tamanho se necessário
     */
    private cleanup;
    /**
     * Limpa todo o cache
     */
    clear(): void;
    /**
     * Retorna estatísticas do cache
     */
    getStats(): {
        size: number;
        maxSize: number;
        enabled: boolean;
    };
}
/**
 * Inicializa o cache global
 */
export declare function initializeCache(config: Config): void;
/**
 * Obtém o cache global
 */
export declare function getCache(): AnalysisCache | null;
/**
 * Verifica se há cache válido para o contexto
 */
export declare function getCachedAnalysis(files: string[], overallDiff: string): CacheResult;
/**
 * Armazena resultado no cache
 */
export declare function setCachedAnalysis(files: string[], overallDiff: string, groups: FileGroup[]): void;
/**
 * Retorna estatísticas do cache
 */
export declare function getCacheStats(): {
    size: number;
    maxSize: number;
    enabled: boolean;
} | null;
/**
 * Limpa o cache global
 */
export declare function clearCache(): void;
export {};
//# sourceMappingURL=cache.d.ts.map