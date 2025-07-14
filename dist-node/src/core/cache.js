import crypto from 'crypto';
class AnalysisCache {
    cache = new Map();
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Gera hash do contexto para identificar análises similares
     */
    generateHash(files, overallDiff) {
        const context = {
            files: files.sort(), // Ordenar para consistência
            diff: overallDiff.substring(0, 1000), // Limitar tamanho do diff
            model: this.config.openai.model,
            temperature: this.config.openai.temperature,
        };
        return crypto
            .createHash('md5')
            .update(JSON.stringify(context))
            .digest('hex');
    }
    /**
     * Verifica se há cache válido para o contexto
     */
    get(files, overallDiff) {
        if (!this.config.cache.enabled) {
            return { hit: false };
        }
        const hash = this.generateHash(files, overallDiff);
        const entry = this.cache.get(hash);
        if (!entry) {
            return { hit: false };
        }
        // Verificar se o cache expirou
        const now = Date.now();
        const ttlMs = this.config.cache.ttl * 60 * 1000; // Converter minutos para ms
        if (now - entry.timestamp > ttlMs) {
            this.cache.delete(hash);
            return { hit: false };
        }
        return { hit: true, groups: entry.groups };
    }
    /**
     * Armazena resultado no cache
     */
    set(files, overallDiff, groups) {
        if (!this.config.cache.enabled) {
            return;
        }
        // Limpar cache se exceder tamanho máximo
        if (this.cache.size >= this.config.cache.maxSize) {
            this.cleanup();
        }
        // Se ainda exceder após cleanup, não adicionar
        if (this.cache.size >= this.config.cache.maxSize) {
            return;
        }
        const hash = this.generateHash(files, overallDiff);
        const entry = {
            groups,
            timestamp: Date.now(),
            hash,
        };
        this.cache.set(hash, entry);
    }
    /**
     * Limpa cache expirado e reduz tamanho se necessário
     */
    cleanup() {
        const now = Date.now();
        const ttlMs = this.config.cache.ttl * 60 * 1000;
        // Remover entradas expiradas
        for (const [hash, entry] of this.cache.entries()) {
            if (now - entry.timestamp > ttlMs) {
                this.cache.delete(hash);
            }
        }
        // Se ainda exceder tamanho máximo, remover entradas mais antigas
        if (this.cache.size >= this.config.cache.maxSize) {
            const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
            // Remover 50% das entradas mais antigas para garantir espaço
            const toRemove = entries.slice(0, Math.ceil(this.config.cache.maxSize * 0.5));
            for (const [hash] of toRemove) {
                this.cache.delete(hash);
            }
        }
    }
    /**
     * Limpa todo o cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Retorna estatísticas do cache
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.config.cache.maxSize,
            enabled: this.config.cache.enabled,
        };
    }
}
// Instância global do cache
let globalCache = null;
/**
 * Inicializa o cache global
 */
export function initializeCache(config) {
    globalCache = new AnalysisCache(config);
}
/**
 * Obtém o cache global
 */
export function getCache() {
    return globalCache;
}
/**
 * Verifica se há cache válido para o contexto
 */
export function getCachedAnalysis(files, overallDiff) {
    const cache = getCache();
    return cache ? cache.get(files, overallDiff) : { hit: false };
}
/**
 * Armazena resultado no cache
 */
export function setCachedAnalysis(files, overallDiff, groups) {
    const cache = getCache();
    if (cache) {
        cache.set(files, overallDiff, groups);
    }
}
/**
 * Retorna estatísticas do cache
 */
export function getCacheStats() {
    const cache = getCache();
    return cache ? cache.getStats() : null;
}
/**
 * Limpa o cache global
 */
export function clearCache() {
    const cache = getCache();
    if (cache) {
        cache.clear();
    }
    // Resetar a instância global
    globalCache = null;
}
//# sourceMappingURL=cache.js.map