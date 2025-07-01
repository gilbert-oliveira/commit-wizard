import chalk from 'chalk';
import { GitUtils } from './git-utils.js';
import { Config } from './config.js';

export interface CommitGroup {
  id: string;
  type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'test' | 'chore' | 'ci';
  emoji: string;
  description: string;
  files: string[];
  diff: string;
  priority: number;
}

export interface SplitCommitResult {
  groups: CommitGroup[];
  totalFiles: number;
  suggestedOrder: string[];
}

/**
 * Serviço para dividir commits grandes em commits menores e organizados
 */
export class CommitSplitter {
  private gitUtils: GitUtils;
  private config: Config;

  constructor(gitUtils: GitUtils, config: Config) {
    this.gitUtils = gitUtils;
    this.config = config;
  }

  /**
   * Analisa um arquivo e determina seu contexto/tipo
   */
  private analyzeFileContext(filePath: string, diff: string): CommitGroup['type'] {
    const fileName = filePath.toLowerCase();
    const diffContent = diff.toLowerCase();

    // Testes
    if (fileName.includes('test') || fileName.includes('spec') || fileName.includes('__tests__')) {
      return 'test';
    }

    // Documentação
    if (
      fileName.includes('readme') ||
      fileName.includes('.md') ||
      fileName.includes('docs/') ||
      fileName.includes('changelog')
    ) {
      return 'docs';
    }

    // CI/CD
    if (
      fileName.includes('.github/') ||
      fileName.includes('ci.yml') ||
      fileName.includes('workflow') ||
      fileName.includes('pipeline')
    ) {
      return 'ci';
    }

    // Configuração/Build
    if (
      fileName.includes('package.json') ||
      fileName.includes('tsconfig') ||
      fileName.includes('eslint') ||
      fileName.includes('.config') ||
      fileName.includes('jest.config') ||
      fileName.includes('.gitignore')
    ) {
      return 'chore';
    }

    // Estilos (CSS, formatação)
    if (
      fileName.includes('.css') ||
      fileName.includes('.scss') ||
      fileName.includes('style') ||
      diffContent.includes('prettier') ||
      diffContent.includes('format')
    ) {
      return 'style';
    }

    // Análise do conteúdo do diff
    if (
      diffContent.includes('fix') ||
      diffContent.includes('bug') ||
      diffContent.includes('error') ||
      diffContent.includes('throw') ||
      diffContent.includes('catch')
    ) {
      return 'fix';
    }

    if (
      diffContent.includes('refactor') ||
      diffContent.includes('rename') ||
      diffContent.includes('move') ||
      diffContent.includes('extract') ||
      diffContent.includes('reorganiz')
    ) {
      return 'refactor';
    }

    // Por padrão, considera como nova funcionalidade
    return 'feat';
  }

  /**
   * Obtém emoji e prioridade para cada tipo de commit
   */
  private getCommitTypeInfo(type: CommitGroup['type']): { emoji: string; priority: number } {
    const typeMap = {
      fix: { emoji: '🐛', priority: 1 },
      test: { emoji: '🧪', priority: 2 },
      docs: { emoji: '📚', priority: 3 },
      chore: { emoji: '🔧', priority: 4 },
      style: { emoji: '💄', priority: 5 },
      refactor: { emoji: '♻️', priority: 6 },
      feat: { emoji: '✨', priority: 7 },
      ci: { emoji: '🔄', priority: 8 },
    };

    return typeMap[type];
  }

  /**
   * Agrupa arquivos relacionados por similaridade de caminho
   */
  private groupRelatedFiles(files: string[]): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    for (const file of files) {
      if (processed.has(file)) continue;

      const group = [file];
      processed.add(file);

      const fileDir = file.split('/').slice(0, -1).join('/');
      const fileName = file.split('/').pop()?.split('.')[0] || '';

      // Procura arquivos relacionados
      for (const otherFile of files) {
        if (processed.has(otherFile) || otherFile === file) continue;

        const otherDir = otherFile.split('/').slice(0, -1).join('/');
        const otherName = otherFile.split('/').pop()?.split('.')[0] || '';

        // Mesmo diretório ou nomes similares
        if (
          fileDir === otherDir ||
          fileName === otherName ||
          otherName.includes(fileName) ||
          fileName.includes(otherName)
        ) {
          group.push(otherFile);
          processed.add(otherFile);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  /**
   * Divide o diff atual em grupos de commits organizados
   */
  async analyzeAndSplit(): Promise<SplitCommitResult> {
    console.log(chalk.blue('\n🔍 Analisando mudanças para dividir em commits...'));

    const changedFiles = this.gitUtils.getChangedFiles();

    if (changedFiles.length === 0) {
      throw new Error('Nenhuma mudança detectada para commit');
    }

    console.log(chalk.gray(`📁 Arquivos alterados: ${changedFiles.length}`));

    // Agrupa arquivos por contexto
    const contextGroups = new Map<string, { files: string[]; type: CommitGroup['type'] }>();

    for (const file of changedFiles) {
      const fileDiff = this.gitUtils.getFileDiff(file);
      const context = this.analyzeFileContext(file, fileDiff);

      const key = context;
      if (!contextGroups.has(key)) {
        contextGroups.set(key, { files: [], type: context });
      }
      contextGroups.get(key)!.files.push(file);
    }

    // Cria grupos de commit
    const commitGroups: CommitGroup[] = [];
    let groupId = 1;

    for (const [, group] of contextGroups) {
      const { emoji, priority } = this.getCommitTypeInfo(group.type);

      // Subdivide grupos grandes por arquivos relacionados
      const relatedGroups = this.groupRelatedFiles(group.files);

      for (const relatedFiles of relatedGroups) {
        const groupDiff = relatedFiles.map(file => this.gitUtils.getFileDiff(file)).join('\n\n');

        commitGroups.push({
          id: `group-${groupId++}`,
          type: group.type,
          emoji,
          description: await this.generateGroupDescription(relatedFiles, group.type),
          files: relatedFiles,
          diff: groupDiff,
          priority,
        });
      }
    }

    // Ordena por prioridade e complexidade
    commitGroups.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.files.length - b.files.length;
    });

    const suggestedOrder = commitGroups.map(g => g.id);

    return {
      groups: commitGroups,
      totalFiles: changedFiles.length,
      suggestedOrder,
    };
  }

  /**
   * Gera descrição inteligente para um grupo de arquivos
   */
  private async generateGroupDescription(
    files: string[],
    type: CommitGroup['type']
  ): Promise<string> {
    const isPortuguese = this.config.language === 'pt';

    // Descrições padrão por tipo
    const defaultDescriptions = {
      feat: isPortuguese ? 'adiciona nova funcionalidade' : 'add new feature',
      fix: isPortuguese ? 'corrige bug' : 'fix bug',
      docs: isPortuguese ? 'atualiza documentação' : 'update documentation',
      style: isPortuguese ? 'melhora formatação do código' : 'improve code formatting',
      refactor: isPortuguese ? 'refatora código' : 'refactor code',
      test: isPortuguese ? 'adiciona/atualiza testes' : 'add/update tests',
      chore: isPortuguese ? 'atualiza configurações' : 'update configuration',
      ci: isPortuguese ? 'atualiza CI/CD' : 'update CI/CD',
    };

    // Se apenas um arquivo, usa nome específico
    if (files.length === 1) {
      const fileName = files[0].split('/').pop() || '';
      return isPortuguese
        ? `${defaultDescriptions[type]} em ${fileName}`
        : `${defaultDescriptions[type]} in ${fileName}`;
    }

    // Se múltiplos arquivos do mesmo diretório
    const commonDir = this.findCommonDirectory(files);
    if (commonDir) {
      return isPortuguese
        ? `${defaultDescriptions[type]} em ${commonDir}`
        : `${defaultDescriptions[type]} in ${commonDir}`;
    }

    // Descrição genérica
    return defaultDescriptions[type];
  }

  /**
   * Encontra diretório comum de uma lista de arquivos
   */
  private findCommonDirectory(files: string[]): string | null {
    if (files.length === 0) return null;

    const dirs = files.map(f => f.split('/').slice(0, -1));
    if (dirs.length === 1) return dirs[0].join('/');

    const commonParts: string[] = [];
    const minLength = Math.min(...dirs.map(d => d.length));

    for (let i = 0; i < minLength; i++) {
      const part = dirs[0][i];
      if (dirs.every(d => d[i] === part)) {
        commonParts.push(part);
      } else {
        break;
      }
    }

    return commonParts.length > 0 ? commonParts.join('/') : null;
  }
}
