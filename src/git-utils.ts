import { execSync } from 'child_process';
import fs from 'fs';

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
        stdio: ['pipe', 'pipe', 'pipe'], // Isola completamente os streams
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

      // Obtém o diff completo com isolamento de streams
      const diff = execSync(`git diff --cached -- . ${excludeArgs}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'], // Isola completamente os streams
      });

      // Limpa o diff de possíveis contaminações
      const cleanDiff = this.cleanDiffOutput(diff);

      return {
        hasStagedFiles: true,
        stagedFiles: stagedFiles.split('\n').filter(file => file.trim()),
        diff: cleanDiff,
      };
    } catch (error) {
      throw new Error(`Erro ao obter status Git: ${error}`);
    }
  }

  /**
   * Limpa o output do diff removendo possíveis contaminações
   */
  private cleanDiffOutput(diff: string): string {
    if (!diff || diff.trim().length === 0) {
      return diff;
    }

    // Remove linhas que claramente não são parte do diff
    const lines = diff.split('\n');
    const cleanLines = lines.filter(line => {
      const trimmed = line.trim();

      // Preserva linhas vazias (são importantes para estrutura do diff)
      if (!trimmed) return true;

      // Remove linhas que contêm comandos shell potenciais ou nomes de funções
      if (
        trimmed.includes('cleanDiffOutput') ||
        trimmed.includes('cleanCommitMessage') ||
        trimmed.includes('cleanApiResponse') ||
        trimmed.includes('AIService') ||
        trimmed.includes('git-utils.test.ts') ||
        trimmed.includes('execSync') ||
        trimmed.includes('GitUtils')
      ) {
        return false;
      }

      // Preserva linhas que são claramente parte do diff (headers e modificações)
      if (
        line.startsWith('diff ') ||
        line.startsWith('index ') ||
        line.startsWith('--- ') ||
        line.startsWith('+++ ') ||
        line.startsWith('@@')
      ) {
        return true;
      }

      // Para linhas que começam com +, -, ou espaço, verifica se não são dados de cobertura
      if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ')) {
        // Se contém caracteres de tabela de cobertura, remove
        if (trimmed.includes('|') && (trimmed.includes('%') || trimmed.match(/\d+\.\d+/))) {
          return false;
        }
        // Se contém nomes de arquivos com extensão seguidos de estatísticas, remove
        if (trimmed.match(/\.(ts|js|tsx|jsx|py|java|c|cpp|h)\s*\|\s*\d+/)) {
          return false;
        }
        // Se é uma linha de contexto ou modificação válida, preserva
        return true;
      }

      // Remove linhas que são claramente tabelas de cobertura
      if (trimmed.includes('|') && trimmed.includes('%') && trimmed.includes('Stmts')) return false;
      if (trimmed.includes('All files') && trimmed.includes('|')) return false;
      if (trimmed.match(/^[-|]+$/) && trimmed.length > 10) return false; // Linhas separadoras longas
      if (trimmed.includes('Uncovered Line #s')) return false;

      // Remove linhas que contêm nomes de arquivos com estatísticas
      if (trimmed.match(/\.(ts|js|tsx|jsx|py|java|c|cpp|h)\s*\|\s*\d+\.\d+/)) return false;

      // Remove linhas que são claramente cabeçalhos de tabelas
      if (trimmed.includes('File') && trimmed.includes('% Stmts') && trimmed.includes('% Branch'))
        return false;

      // Remove linhas que começam com espaços seguidos de diretório e estatísticas
      if (trimmed.match(/^(src|tests?|lib|dist|app|components)\s*\|\s*\d+\.\d+/)) return false;

      // Remove linhas com apenas caracteres de tabela
      if (trimmed.match(/^[\s\-|%]+$/) && trimmed.length > 5) return false;

      // Remove linhas que contêm caracteres potencialmente perigosos para shell
      if (trimmed.match(/[;|&$`]/) && !trimmed.match(/^[+-].*[;|&$`]/)) {
        return false;
      }

      // Se chegou até aqui, preserva a linha
      return true;
    });

    return cleanLines.join('\n');
  }

  /**
   * Realiza commit com mensagem usando arquivo temporário (mais seguro)
   */
  commit(message: string, additionalArgs: string[] = []): void {
    if (!this.isGitRepository()) {
      throw new Error('Diretório atual não é um repositório Git');
    }

    // Limpa e valida a mensagem
    const cleanMessage = this.cleanCommitMessage(message);

    if (!cleanMessage) {
      throw new Error('Mensagem de commit vazia após limpeza');
    }

    // Usa arquivo temporário para evitar problemas com caracteres especiais
    const tempFile = '/tmp/commit-wizard-message.txt';
    try {
      fs.writeFileSync(tempFile, cleanMessage, 'utf8');
      this.commitWithFile(tempFile, additionalArgs);
    } finally {
      // Remove o arquivo temporário
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Ignora erro se não conseguir remover
      }
    }
  }

  /**
   * Limpa a mensagem de commit removendo conteúdo inválido
   */
  private cleanCommitMessage(message: string): string {
    // Remove linhas que não deveriam estar na mensagem
    const lines = message.split('\n');
    const cleanLines = lines.filter(line => {
      const trimmed = line.trim();

      // Remove linhas vazias
      if (!trimmed) return false;

      // Remove linhas que contêm comandos shell potenciais
      if (
        trimmed.includes('cleanDiffOutput') ||
        trimmed.includes('cleanCommitMessage') ||
        trimmed.includes('cleanApiResponse') ||
        trimmed.includes('AIService') ||
        trimmed.includes('git-utils.test.ts')
      ) {
        return false;
      }

      // Remove linhas que contêm tabelas de cobertura (mais rigoroso)
      if (
        trimmed.includes('|') &&
        (trimmed.includes('%') || trimmed.includes('Stmts') || trimmed.includes('Branch'))
      )
        return false;
      if (trimmed.match(/^[-|]+$/)) return false;
      if (trimmed.includes('File') && trimmed.includes('Stmts')) return false;
      if (trimmed.includes('All files') && trimmed.includes('|')) return false;
      if (trimmed.includes('Uncovered Line')) return false;

      // Remove linhas com apenas caracteres especiais
      if (trimmed.match(/^[\s\-|%]+$/)) return false;

      // Remove linhas que parecem output de ferramentas de cobertura
      if (trimmed.includes('coverage') && trimmed.includes('|')) return false;
      if (trimmed.includes('----') && trimmed.includes('|')) return false;

      // Remove linhas que contêm nomes de arquivos com estatísticas (padrão específico)
      if (trimmed.match(/\.(ts|js|tsx|jsx)\s*\|\s*\d+\.\d+\s*\|\s*\d+\.\d+/)) return false;

      // Remove linhas que contêm "src" ou diretórios com estatísticas
      if (trimmed.match(/^\s*(src|tests?|lib|dist)\s*\|\s*\d+\.\d+/)) return false;

      // Remove linhas com números que parecem estatísticas de cobertura
      if (trimmed.match(/\|\s*\d+\.\d+\s*\|\s*\d+\.\d+\s*\|\s*\d+\.\d+\s*\|\s*\d+\.\d+\s*\|/))
        return false;

      // Remove linhas que contêm caracteres potencialmente perigosos para shell
      if (
        trimmed.match(/[;|&$`]/) &&
        !trimmed.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)[:(]/)
      ) {
        return false;
      }

      return true;
    });

    // Reconstrói a mensagem
    let result = cleanLines.join('\n').trim();

    // Remove múltiplas linhas vazias
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Remove linhas vazias no início e fim
    result = result.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');

    // Sanitiza caracteres especiais que podem causar problemas
    result = result.replace(/[`$\\]/g, '\\$&');

    return result;
  }

  /**
   * Realiza commit usando arquivo temporário para a mensagem
   */
  commitWithFile(messageFile: string, additionalArgs: string[] = []): void {
    if (!this.isGitRepository()) {
      throw new Error('Diretório atual não é um repositório Git');
    }

    // Valida se o arquivo de mensagem existe
    if (!fs.existsSync(messageFile)) {
      throw new Error(`Arquivo de mensagem não encontrado: ${messageFile}`);
    }

    // Valida o conteúdo do arquivo
    try {
      const content = fs.readFileSync(messageFile, 'utf8');
      if (!content.trim()) {
        throw new Error('Arquivo de mensagem está vazio');
      }
    } catch (error) {
      throw new Error(`Erro ao ler arquivo de mensagem: ${error}`);
    }

    try {
      // Constrói o comando com sanitização dos argumentos
      const baseCommand = 'git commit -F';
      const sanitizedFile = messageFile.replace(/[;|&$`"'\\]/g, '\\$&');
      const sanitizedArgs = additionalArgs.map(arg => arg.replace(/[;|&$`"'\\]/g, '\\$&'));

      const args =
        sanitizedArgs.length > 0
          ? [baseCommand, `"${sanitizedFile}"`, ...sanitizedArgs]
          : [baseCommand, `"${sanitizedFile}"`];

      // Executa o comando de forma mais segura
      execSync(args.join(' '), {
        stdio: 'inherit',
        shell: '/bin/bash', // Force bash para consistência
        env: { ...process.env, LC_ALL: 'C' }, // Força locale C para evitar problemas de codificação
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

  /**
   * Obtém lista de arquivos alterados (staged)
   */
  getChangedFiles(): string[] {
    const status = this.getStagedStatus();
    return status.stagedFiles;
  }

  /**
   * Obtém diff de um arquivo específico
   */
  getFileDiff(filePath: string): string {
    if (!this.isGitRepository()) {
      throw new Error('Diretório atual não é um repositório Git');
    }

    try {
      const diff = execSync(`git diff --cached -- "${filePath}"`, { encoding: 'utf8' });
      return diff;
    } catch {
      return '';
    }
  }

  /**
   * Obtém diff completo dos arquivos staged
   */
  getStagedDiff(): string {
    const status = this.getStagedStatus();
    return status.diff;
  }
}
