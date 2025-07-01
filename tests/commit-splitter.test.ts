// Mock chalk para evitar problemas de import
jest.mock('chalk', () => ({
  blue: jest.fn((str: string) => str),
  gray: jest.fn((str: string) => str),
}));

import { CommitSplitter } from '../src/commit-splitter.js';
import { GitUtils } from '../src/git-utils.js';
import { Config } from '../src/config.js';

// Mock do GitUtils
const mockGitUtils = {
  getStagedDiff: jest.fn(),
  getChangedFiles: jest.fn(),
  getFileDiff: jest.fn(),
} as unknown as GitUtils;

const mockConfig: Config = {
  apiKey: 'test-key',
  model: 'gpt-4o',
  language: 'pt',
  temperature: 0.7,
  maxTokens: 1000,
  autoCommit: false,
  includeEmoji: true,
  excludePatterns: [],
};

describe('CommitSplitter', () => {
  let commitSplitter: CommitSplitter;

  beforeEach(() => {
    commitSplitter = new CommitSplitter(mockGitUtils, mockConfig);
    jest.clearAllMocks();
  });

  describe('analyzeFileContext', () => {
    test('deve detectar arquivos de teste', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.analyzeFileContext('src/utils.test.ts', '')).toBe('test');
      expect(splitter.analyzeFileContext('tests/spec.js', '')).toBe('test');
      expect(splitter.analyzeFileContext('__tests__/component.test.jsx', '')).toBe('test');
    });

    test('deve detectar arquivos de documentação', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.analyzeFileContext('README.md', '')).toBe('docs');
      expect(splitter.analyzeFileContext('docs/guide.md', '')).toBe('docs');
      expect(splitter.analyzeFileContext('CHANGELOG.md', '')).toBe('docs');
    });

    test('deve detectar arquivos de CI/CD', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.analyzeFileContext('.github/workflows/ci.yml', '')).toBe('ci');
      expect(splitter.analyzeFileContext('.github/workflow/deploy.yml', '')).toBe('ci');
    });

    test('deve detectar arquivos de configuração', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.analyzeFileContext('package.json', '')).toBe('chore');
      expect(splitter.analyzeFileContext('tsconfig.json', '')).toBe('chore');
      expect(splitter.analyzeFileContext('eslint.config.js', '')).toBe('chore');
      expect(splitter.analyzeFileContext('.gitignore', '')).toBe('chore');
    });

    test('deve detectar arquivos de estilo', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.analyzeFileContext('styles.css', '')).toBe('style');
      expect(splitter.analyzeFileContext('main.scss', '')).toBe('style');
    });

    test('deve detectar bugs por conteúdo do diff', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.analyzeFileContext('app.ts', 'fix bug in function')).toBe('fix');
      expect(splitter.analyzeFileContext('utils.js', 'throw new Error')).toBe('fix');
    });

    test('deve detectar refatoração por conteúdo do diff', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.analyzeFileContext('service.ts', 'refactor code structure')).toBe('refactor');
      expect(splitter.analyzeFileContext('helpers.js', 'rename function')).toBe('refactor');
    });

    test('deve retornar feat como padrão', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.analyzeFileContext('src/component.tsx', 'new feature')).toBe('feat');
      expect(splitter.analyzeFileContext('lib/utils.js', '')).toBe('feat');
    });
  });

  describe('getCommitTypeInfo', () => {
    test('deve retornar informações corretas para cada tipo', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.getCommitTypeInfo('fix')).toEqual({ emoji: '🐛', priority: 1 });
      expect(splitter.getCommitTypeInfo('test')).toEqual({ emoji: '🧪', priority: 2 });
      expect(splitter.getCommitTypeInfo('docs')).toEqual({ emoji: '📚', priority: 3 });
      expect(splitter.getCommitTypeInfo('chore')).toEqual({ emoji: '🔧', priority: 4 });
      expect(splitter.getCommitTypeInfo('style')).toEqual({ emoji: '💄', priority: 5 });
      expect(splitter.getCommitTypeInfo('refactor')).toEqual({ emoji: '♻️', priority: 6 });
      expect(splitter.getCommitTypeInfo('feat')).toEqual({ emoji: '✨', priority: 7 });
      expect(splitter.getCommitTypeInfo('ci')).toEqual({ emoji: '🔄', priority: 8 });
    });
  });

  describe('groupRelatedFiles', () => {
    test('deve agrupar arquivos do mesmo diretório', () => {
      const splitter = commitSplitter as any;
      const files = ['src/component.ts', 'src/service.ts', 'tests/other.test.ts'];
      
      const groups = splitter.groupRelatedFiles(files);
      
      expect(groups).toHaveLength(2);
      expect(groups.some((g: string[]) => g.includes('src/component.ts') && g.includes('src/service.ts'))).toBe(true);
      expect(groups.some((g: string[]) => g.includes('tests/other.test.ts'))).toBe(true);
    });

    test('deve agrupar arquivos com nomes similares', () => {
      const splitter = commitSplitter as any;
      const files = ['user.ts', 'user.test.ts', 'other.ts'];
      
      const groups = splitter.groupRelatedFiles(files);
      
      const userGroup = groups.find((g: string[]) => g.includes('user.ts'));
      expect(userGroup).toContain('user.ts');
      expect(userGroup).toContain('user.test.ts');
    });
  });

  describe('generateGroupDescription', () => {
    test('deve gerar descrição em português', async () => {
      const splitter = commitSplitter as any;
      
      const description = await splitter.generateGroupDescription(['test.ts'], 'test');
      expect(description).toBe('adiciona/atualiza testes em test.ts');
    });

    test('deve gerar descrição em inglês', async () => {
      const configEn: Config = { ...mockConfig, language: 'en' };
      const splitterEn = new CommitSplitter(mockGitUtils, configEn) as any;
      
      const description = await splitterEn.generateGroupDescription(['test.ts'], 'test');
      expect(description).toBe('add/update tests in test.ts');
    });

    test('deve usar diretório comum para múltiplos arquivos', async () => {
      const splitter = commitSplitter as any;
      
      const description = await splitter.generateGroupDescription(['src/a.ts', 'src/b.ts'], 'feat');
      expect(description).toBe('adiciona nova funcionalidade em src');
    });
  });

  describe('findCommonDirectory', () => {
    test('deve encontrar diretório comum', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.findCommonDirectory(['src/a.ts', 'src/b.ts'])).toBe('src');
      expect(splitter.findCommonDirectory(['src/utils/a.ts', 'src/utils/b.ts'])).toBe('src/utils');
    });

    test('deve retornar null quando não há diretório comum', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.findCommonDirectory(['src/a.ts', 'tests/b.ts'])).toBe(null);
    });

    test('deve retornar null para array vazio', () => {
      const splitter = commitSplitter as any;
      
      expect(splitter.findCommonDirectory([])).toBe(null);
    });
  });

  describe('analyzeAndSplit', () => {
    test('deve lançar erro quando não há arquivos alterados', async () => {
      (mockGitUtils.getChangedFiles as jest.Mock).mockReturnValue([]);
      
      await expect(commitSplitter.analyzeAndSplit()).rejects.toThrow('Nenhuma mudança detectada para commit');
    });

    test('deve retornar grupos organizados por contexto', async () => {
      (mockGitUtils.getChangedFiles as jest.Mock).mockReturnValue([
        'src/component.tsx',
        'src/component.test.tsx',
        'README.md'
      ]);
      
      (mockGitUtils.getFileDiff as jest.Mock)
        .mockReturnValueOnce('// new component')
        .mockReturnValueOnce('// test for component')
        .mockReturnValueOnce('# Updated docs');

      const result = await commitSplitter.analyzeAndSplit();
      
      expect(result.totalFiles).toBe(3);
      expect(result.groups.length).toBeGreaterThan(1);
      
      // Verifica se os tipos estão corretos
      const types = result.groups.map(g => g.type);
      expect(types).toContain('feat');
      expect(types).toContain('test');
      expect(types).toContain('docs');
      
      // Verifica ordenação por prioridade
      for (let i = 1; i < result.groups.length; i++) {
        expect(result.groups[i].priority).toBeGreaterThanOrEqual(result.groups[i-1].priority);
      }
    });
  });
}); 