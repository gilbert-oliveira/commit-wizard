import { execSync } from 'child_process';

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
export function escapeShellArg(arg: string): string {
  // Para mensagens de commit, usamos aspas simples que são mais seguras
  // Escapamos apenas aspas simples dentro da string
  return `'${arg.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Verifica se estamos em um repositório Git
 */
export function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém o status dos arquivos staged e o diff
 */
export function getGitStatus(): GitStatus {
  try {
    // Verificar arquivos staged
    const stagedOutput = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const stagedFiles = stagedOutput
      .trim()
      .split('\n')
      .filter((file) => file.length > 0);

    // Obter diff dos arquivos staged
    const diff =
      stagedFiles.length > 0
        ? execSync('git diff --cached', { encoding: 'utf-8', stdio: 'pipe' })
        : '';

    return {
      hasStaged: stagedFiles.length > 0,
      stagedFiles,
      diff: diff.trim(),
    };
  } catch (error) {
    throw new Error(
      `Erro ao obter status do Git: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Obtém o diff de um arquivo específico
 */
export function getFileDiff(filename: string): string {
  try {
    return execSync(`git diff --cached -- "${filename}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (error) {
    throw new Error(
      `Erro ao obter diff do arquivo ${filename}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Executa um commit com a mensagem fornecida
 */
export function executeCommit(message: string): GitCommitResult {
  try {
    // Usar aspas simples para evitar problemas com caracteres especiais
    const escapedMessage = escapeShellArg(message);
    execSync(`git commit -m ${escapedMessage}`, {
      stdio: 'pipe',
    });

    // Obter hash do commit
    const hash = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    return {
      success: true,
      hash,
      message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao executar commit',
    };
  }
}

/**
 * Executa commit de arquivo específico
 */
export function executeFileCommit(
  filename: string,
  message: string
): GitCommitResult {
  try {
    // Usar aspas simples para evitar problemas com caracteres especiais
    const escapedMessage = escapeShellArg(message);
    const escapedFilename = escapeShellArg(filename);
    execSync(`git commit ${escapedFilename} -m ${escapedMessage}`, {
      stdio: 'pipe',
    });

    // Obter hash do commit
    const hash = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();

    return {
      success: true,
      hash,
      message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao executar commit do arquivo',
    };
  }
}

/**
 * Obtém estatísticas do diff (linhas adicionadas/removidas)
 */
export function getDiffStats(): {
  added: number;
  removed: number;
  files: number;
} {
  try {
    const output = execSync('git diff --cached --numstat', {
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    const lines = output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0);
    let added = 0;
    let removed = 0;

    lines.forEach((line) => {
      const [addedStr, removedStr] = line.split('\t');
      if (addedStr && addedStr !== '-') added += parseInt(addedStr) || 0;
      if (removedStr && removedStr !== '-')
        removed += parseInt(removedStr) || 0;
    });

    return { added, removed, files: lines.length };
  } catch {
    return { added: 0, removed: 0, files: 0 };
  }
}
