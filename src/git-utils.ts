import { execSync } from 'child_process';

export interface GitStatus {
  hasStagedFiles: boolean;
  stagedFiles: string[];
  diff: string;
}

/**
 * Utilitários para operações Git
 */
export class GitUtils {
  private excludePatterns: string[];

  constructor(excludePatterns: string[] = []) {
    this.excludePatterns = excludePatterns;
  }

  /**
   * Verifica se o diretório atual é um repositório Git
   */
  isGitRepository(): boolean {
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Constrói argumentos de exclusão para comandos git
   */
  private buildExcludeArgs(): string {
    if (this.excludePatterns.length === 0) {
      return '';
    }

    return this.excludePatterns.map(pattern => `":(exclude)${pattern}"`).join(' ');
  }

  /**
   * Obtém status dos arquivos staged
   */
  getStagedStatus(): GitStatus {
    if (!this.isGitRepository()) {
      throw new Error('Diretório atual não é um repositório Git');
    }

    const excludeArgs = this.buildExcludeArgs();

    try {
      // Verifica arquivos staged
      const stagedFiles = execSync(`git diff --cached --name-only -- . ${excludeArgs}`, {
        encoding: 'utf8',
      })
        .toString()
        .trim();

      if (!stagedFiles) {
        return {
          hasStagedFiles: false,
          stagedFiles: [],
          diff: '',
        };
      }

      // Obtém o diff completo
      const diff = execSync(`git diff --cached -- . ${excludeArgs}`, { encoding: 'utf8' });

      return {
        hasStagedFiles: true,
        stagedFiles: stagedFiles.split('\n').filter(file => file.trim()),
        diff,
      };
    } catch (error) {
      throw new Error(`Erro ao obter status Git: ${error}`);
    }
  }

  /**
   * Realiza commit com mensagem
   */
  commit(message: string, additionalArgs: string[] = []): void {
    if (!this.isGitRepository()) {
      throw new Error('Diretório atual não é um repositório Git');
    }

    try {
      const args = additionalArgs.length > 0 ? ` ${additionalArgs.join(' ')}` : '';
      execSync(`git commit -m "${message.replace(/"/g, '\\"')}"${args}`, {
        stdio: 'inherit',
      });
    } catch (error) {
      throw new Error(`Erro ao realizar commit: ${error}`);
    }
  }

  /**
   * Realiza commit usando arquivo temporário para a mensagem
   */
  commitWithFile(messageFile: string, additionalArgs: string[] = []): void {
    if (!this.isGitRepository()) {
      throw new Error('Diretório atual não é um repositório Git');
    }

    try {
      const args = additionalArgs.length > 0 ? ` ${additionalArgs.join(' ')}` : '';
      execSync(`git commit -F "${messageFile}"${args}`, {
        stdio: 'inherit',
      });
    } catch (error) {
      throw new Error(`Erro ao realizar commit: ${error}`);
    }
  }

  /**
   * Obtém informações sobre o último commit
   */
  getLastCommitInfo(): { hash: string; message: string; author: string; date: string } {
    if (!this.isGitRepository()) {
      throw new Error('Diretório atual não é um repositório Git');
    }

    try {
      const info = execSync('git log -1 --pretty=format:"%H|%s|%an|%ad" --date=short', {
        encoding: 'utf8',
      });

      const [hash, message, author, date] = info.split('|');
      return { hash, message, author, date };
    } catch (error) {
      throw new Error(`Erro ao obter informações do último commit: ${error}`);
    }
  }

  /**
   * Verifica se há arquivos não commitados
   */
  hasUncommittedChanges(): boolean {
    if (!this.isGitRepository()) {
      return false;
    }

    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      return status.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Lista branches disponíveis
   */
  getBranches(): { current: string; all: string[] } {
    if (!this.isGitRepository()) {
      throw new Error('Diretório atual não é um repositório Git');
    }

    try {
      const branchOutput = execSync('git branch', { encoding: 'utf8' });
      const branches = branchOutput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line);

      const current =
        branches
          .find(branch => branch.startsWith('*'))
          ?.replace('*', '')
          .trim() || '';

      const all = branches.map(branch => branch.replace('*', '').trim());

      return { current, all };
    } catch (error) {
      throw new Error(`Erro ao obter branches: ${error}`);
    }
  }
}
