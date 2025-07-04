import { encode } from 'gpt-tokenizer';

export interface DiffStats {
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  complexity: 'simple' | 'moderate' | 'complex';
  tokenCount: number;
}

export interface ProcessedDiff {
  content: string;
  stats: DiffStats;
}

/**
 * Processador de diff adaptado para VS Code
 */
export class DiffProcessorVSCode {
  private lastStats: DiffStats | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_excludePatterns: string[] = []) {
    // excludePatterns não é usado nesta versão simplificada
  }

  /**
   * Processa diff e retorna conteúdo processado
   */
  processDiff(diff: string): ProcessedDiff {
    const stats = this.calculateStats(diff);
    this.lastStats = stats;

    // Se o diff é muito grande, podemos precisar resumir
    const content = this.shouldSummarize(diff) ? this.summarizeDiff(diff) : diff;

    return {
      content,
      stats,
    };
  }

  /**
   * Retorna estatísticas do último diff processado
   */
  getStats(): DiffStats {
    return (
      this.lastStats || {
        filesChanged: 0,
        linesAdded: 0,
        linesDeleted: 0,
        complexity: 'simple',
        tokenCount: 0,
      }
    );
  }

  /**
   * Calcula estatísticas do diff
   */
  private calculateStats(diff: string): DiffStats {
    const lines = diff.split('\n');
    let linesAdded = 0;
    let linesDeleted = 0;
    let filesChanged = 0;

    // Conta arquivos alterados
    const fileHeaders = diff.match(/^diff --git/gm);
    filesChanged = fileHeaders ? fileHeaders.length : 0;

    // Conta linhas adicionadas e removidas
    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        linesAdded++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        linesDeleted++;
      }
    }

    // Calcula tokens
    const tokenCount = encode(diff).length;

    // Determina complexidade
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (tokenCount > 2000 || filesChanged > 10) {
      complexity = 'complex';
    } else if (tokenCount > 500 || filesChanged > 3) {
      complexity = 'moderate';
    }

    return {
      filesChanged,
      linesAdded,
      linesDeleted,
      complexity,
      tokenCount,
    };
  }

  /**
   * Verifica se o diff deve ser resumido
   */
  private shouldSummarize(diff: string): boolean {
    const tokenCount = encode(diff).length;
    return tokenCount > 3000; // Limite para resumir
  }

  /**
   * Resume diff grande mantendo informações importantes
   */
  private summarizeDiff(diff: string): string {
    const lines = diff.split('\n');
    const importantLines: string[] = [];

    for (const line of lines) {
      // Mantém headers de arquivo
      if (
        line.startsWith('diff --git') ||
        line.startsWith('index ') ||
        line.startsWith('--- ') ||
        line.startsWith('+++ ') ||
        line.startsWith('@@')
      ) {
        importantLines.push(line);
      }
      // Mantém algumas linhas de contexto
      else if (line.startsWith('+') || line.startsWith('-')) {
        importantLines.push(line);
      }
    }

    // Se ainda é muito grande, pega apenas os primeiros N caracteres
    const result = importantLines.join('\n');
    if (result.length > 8000) {
      return result.substring(0, 8000) + '\n... (diff truncado)';
    }

    return result;
  }

  /**
   * Extrai informações de arquivos alterados
   */
  getChangedFiles(diff: string): string[] {
    const files: string[] = [];
    const lines = diff.split('\n');

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        const match = line.match(/b\/(.+)$/);
        if (match) {
          files.push(match[1]);
        }
      }
    }

    return files;
  }

  /**
   * Verifica se há breaking changes
   */
  hasBreakingChanges(diff: string): boolean {
    const breakingPatterns = [
      /class.*\{[\s\S]*?constructor.*\(/,
      /interface.*\{[\s\S]*?\}/,
      /export.*function.*\(/,
      /export.*class/,
      /export.*interface/,
      /export.*type/,
      /API/i,
      /BREAKING/i,
      /deprecated/i,
      /remove.*function/i,
      /delete.*method/i,
    ];

    return breakingPatterns.some(pattern => pattern.test(diff));
  }
}
