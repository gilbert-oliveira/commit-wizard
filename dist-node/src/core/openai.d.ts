import type { Config } from '../config/index';
export interface CommitSuggestion {
    message: string;
    type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore' | 'build' | 'ci';
    confidence: number;
}
export interface OpenAIResponse {
    success: boolean;
    suggestion?: CommitSuggestion;
    error?: string;
}
/**
 * Constrói o prompt para a OpenAI baseado no diff e configurações (otimizado)
 */
export declare function buildPrompt(diff: string, config: Config, filenames: string[]): string;
/**
 * Extrai o tipo de commit da mensagem gerada pela OpenAI
 */
export declare function extractCommitTypeFromMessage(message: string): CommitSuggestion['type'] | null;
/**
 * Detecta o tipo de commit baseado no diff
 */
export declare function detectCommitType(diff: string, filenames: string[]): CommitSuggestion['type'];
/**
 * Processa a mensagem retornada pela OpenAI removendo formatação desnecessária
 */
export declare function processOpenAIMessage(message: string): string;
/**
 * Consome a API da OpenAI para gerar mensagem de commit
 */
export declare function generateCommitMessage(diff: string, config: Config, filenames: string[]): Promise<OpenAIResponse>;
/**
 * Gera mensagem com retry em caso de falha
 */
export declare function generateWithRetry(diff: string, config: Config, filenames: string[], maxRetries?: number): Promise<OpenAIResponse>;
//# sourceMappingURL=openai.d.ts.map