import { encode, decode } from 'gpt-tokenizer';
import { AIService } from './ai-service.js';
import ora from 'ora';
import cliProgress from 'cli-progress';

/**
 * Processador de diff para chunks e resumos
 */
export class DiffProcessor {
  private aiService: AIService;
  private maxTokens: number;

  constructor(aiService: AIService, maxTokens: number = 1000) {
    this.aiService = aiService;
    this.maxTokens = maxTokens;
  }

  /**
   * Divide o diff em chunks menores baseado na contagem de tokens
   */
  chunkDiff(diff: string): string[] {
    const tokens = encode(diff);

    if (tokens.length <= this.maxTokens) {
      return [diff];
    }

    const chunks: string[] = [];

    for (let i = 0; i < tokens.length; i += this.maxTokens) {
      const chunkTokens = tokens.slice(i, i + this.maxTokens);
      const chunkText = decode(chunkTokens);
      chunks.push(chunkText);
    }

    return chunks;
  }

  /**
   * Processa diff grande gerando resumos dos chunks
   */
  async processLargeDiff(diff: string): Promise<string> {
    const chunks = this.chunkDiff(diff);

    if (chunks.length === 1) {
      return chunks[0];
    }

    const partialSummaries: string[] = [];

    // Se há muitos chunks, usa progress bar
    if (chunks.length > 3) {
      console.log(`\n📊 Processando ${chunks.length} chunks do diff...\n`);

      const progressBar = new cliProgress.SingleBar({
        format:
          '🔄 Progresso |' + '{bar}' + '| {percentage}% | {value}/{total} chunks | ETA: {eta}s',
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
      });

      progressBar.start(chunks.length, 0);

      try {
        for (let i = 0; i < chunks.length; i++) {
          const summary = await this.aiService.generateSummary(chunks[i]);
          partialSummaries.push(summary);
          progressBar.update(i + 1);
        }

        progressBar.stop();
        console.log(`✅ ${chunks.length} chunks processados com sucesso.\n`);
      } catch (error) {
        progressBar.stop();
        console.log('❌ Erro ao processar chunks do diff.\n');
        throw error;
      }
    } else {
      // Para poucos chunks, usa spinner simples
      const spinner = ora(`Processando ${chunks.length} chunks...`).start();

      try {
        for (let i = 0; i < chunks.length; i++) {
          spinner.text = `Processando chunk ${i + 1}/${chunks.length}...`;
          const summary = await this.aiService.generateSummary(chunks[i]);
          partialSummaries.push(summary);
        }

        spinner.succeed(`${chunks.length} chunks processados.`);
      } catch (error) {
        spinner.fail('Erro ao processar chunks.');
        throw error;
      }
    }

    return partialSummaries.join('\n\n');
  }

  /**
   * Analisa a complexidade do diff
   */
  analyzeDiffComplexity(diff: string): {
    tokenCount: number;
    lineCount: number;
    fileCount: number;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const tokens = encode(diff);
    const lines = diff.split('\n');
    const fileChanges = (diff.match(/^diff --git/gm) || []).length;

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';

    if (tokens.length > 2000 || fileChanges > 10) {
      complexity = 'complex';
    } else if (tokens.length > 500 || fileChanges > 3) {
      complexity = 'moderate';
    }

    return {
      tokenCount: tokens.length,
      lineCount: lines.length,
      fileCount: fileChanges,
      complexity,
    };
  }

  /**
   * Extrai estatísticas do diff
   */
  extractDiffStats(diff: string): {
    additions: number;
    deletions: number;
    files: string[];
    types: string[];
  } {
    const lines = diff.split('\n');
    let additions = 0;
    let deletions = 0;
    const files: string[] = [];
    const types = new Set<string>();

    for (const line of lines) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
      } else if (line.startsWith('diff --git')) {
        const match = line.match(/b\/(.+)$/);
        if (match) {
          const file = match[1];
          files.push(file);

          const ext = file.split('.').pop()?.toLowerCase();
          if (ext) {
            types.add(ext);
          }
        }
      }
    }

    return {
      additions,
      deletions,
      files,
      types: Array.from(types),
    };
  }

  /**
   * Verifica se o diff contém breaking changes
   */
  detectBreakingChanges(diff: string): boolean {
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
