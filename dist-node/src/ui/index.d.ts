import type { CommitSuggestion } from '../core/openai';
export interface UIAction {
    action: 'commit' | 'edit' | 'copy' | 'cancel';
    message?: string;
}
/**
 * Exibe a mensagem gerada e permite interação do usuário
 */
export declare function showCommitPreview(suggestion: CommitSuggestion): Promise<UIAction>;
/**
 * Permite edição da mensagem de commit
 */
export declare function editCommitMessage(originalMessage: string): Promise<UIAction>;
/**
 * Copia mensagem para clipboard
 */
export declare function copyToClipboard(message: string): Promise<boolean>;
/**
 * Confirma execução do commit
 */
export declare function confirmCommit(message: string): Promise<boolean>;
/**
 * Exibe resultado do commit
 */
export declare function showCommitResult(success: boolean, hash?: string, error?: string): void;
/**
 * Interface para modo split (múltiplos commits)
 */
export declare function selectFilesForCommit(files: string[]): Promise<string[]>;
/**
 * Confirma se usuário quer continuar com mais commits
 */
export declare function askContinueCommits(remainingFiles: string[]): Promise<boolean>;
/**
 * Exibe mensagem de cancelamento
 */
export declare function showCancellation(): void;
//# sourceMappingURL=index.d.ts.map