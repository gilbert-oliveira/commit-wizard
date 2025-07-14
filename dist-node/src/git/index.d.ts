export interface GitStatus {
    hasStaged: boolean;
    stagedFiles: string[];
    diff: string;
}
export interface GitCommitResult {
    success: boolean;
    hash?: string;
    message?: string;
    error?: string;
}
/**
 * Escapa caracteres especiais para uso seguro em comandos shell
 */
export declare function escapeShellArg(arg: string): string;
/**
 * Verifica se estamos em um repositório Git
 */
export declare function isGitRepository(): boolean;
/**
 * Obtém o status dos arquivos staged e o diff
 */
export declare function getGitStatus(): GitStatus;
/**
 * Obtém o diff de um arquivo específico
 */
export declare function getFileDiff(filename: string): string;
/**
 * Executa um commit com a mensagem fornecida
 */
export declare function executeCommit(message: string): GitCommitResult;
/**
 * Executa commit de arquivo específico
 */
export declare function executeFileCommit(filename: string, message: string): GitCommitResult;
/**
 * Obtém estatísticas do diff (linhas adicionadas/removidas)
 */
export declare function getDiffStats(): {
    added: number;
    removed: number;
    files: number;
};
//# sourceMappingURL=index.d.ts.map