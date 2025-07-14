import { describe, it, expect } from '@jest/globals';
import {
  buildPrompt,
  extractCommitTypeFromMessage,
  detectCommitType,
  processOpenAIMessage,
} from '../src/core/openai';
import type { Config } from '../src/config/index';

describe('OpenAI Module', () => {
  const mockConfig: Config = {
    openai: {
      model: 'gpt-4o',
      maxTokens: 150,
      temperature: 0.7,
      apiKey: 'sk-test-key',
      timeout: 30000,
      retries: 2,
    },
    language: 'pt',
    commitStyle: 'conventional',
    autoCommit: false,
    splitCommits: false,
    dryRun: false,
    smartSplit: {
      enabled: true,
      minGroupSize: 1,
      maxGroups: 5,
      confidenceThreshold: 0.7,
    },
    cache: {
      enabled: true,
      ttl: 60,
      maxSize: 100,
    },
  };

  describe('buildPrompt', () => {
    it('should build prompt with Portuguese language', () => {
      const diff = '+console.log("test");';
      const filenames = ['test.js'];

      const prompt = buildPrompt(diff, mockConfig, filenames);

      expect(prompt).toContain('português');
      expect(prompt).toContain('conventional');
      expect(prompt).toContain('test.js');
      expect(prompt).toContain(diff);
    });

    it('should build prompt with English language', () => {
      const englishConfig = { ...mockConfig, language: 'en' };
      const diff = '+console.log("test");';
      const filenames = ['test.js'];

      const prompt = buildPrompt(diff, englishConfig, filenames);

      expect(prompt).toContain('english');
      expect(prompt).toContain('conventional');
      expect(prompt).toContain('test.js');
      expect(prompt).toContain(diff);
    });
  });

  describe('extractCommitTypeFromMessage', () => {
    it('should extract feat type correctly', () => {
      const message = 'feat(auth): add user authentication';
      const type = extractCommitTypeFromMessage(message);
      expect(type).toBe('feat');
    });

    it('should extract fix type correctly', () => {
      const message = 'fix: resolve login issue';
      const type = extractCommitTypeFromMessage(message);
      expect(type).toBe('fix');
    });

    it('should extract docs type correctly', () => {
      const message = 'docs(readme): update installation guide';
      const type = extractCommitTypeFromMessage(message);
      expect(type).toBe('docs');
    });

    it('should return null for non-conventional messages', () => {
      const message = 'update some files';
      const type = extractCommitTypeFromMessage(message);
      expect(type).toBeNull();
    });

    it('should handle case insensitive matching', () => {
      const message = 'FEAT: add new feature';
      const type = extractCommitTypeFromMessage(message);
      expect(type).toBe('feat');
    });
  });

  describe('detectCommitType', () => {
    it('should detect test type for test files', () => {
      const diff = '+describe("test", () => {});';
      const filenames = ['test.spec.js', 'utils.test.ts'];

      const type = detectCommitType(diff, filenames);
      expect(type).toBe('test');
    });

    it('should detect docs type for markdown files', () => {
      const diff = '+# New Documentation';
      const filenames = ['README.md', 'docs/guide.md'];

      const type = detectCommitType(diff, filenames);
      expect(type).toBe('docs');
    });

    it('should detect build type for package.json', () => {
      const diff = '+"dependency": "^1.0.0"';
      const filenames = ['package.json'];

      const type = detectCommitType(diff, filenames);
      expect(type).toBe('build');
    });

    it('should detect style type for CSS files', () => {
      const diff = '+.button { color: red; }';
      const filenames = ['styles.css', 'main.scss'];

      const type = detectCommitType(diff, filenames);
      expect(type).toBe('style');
    });

    it('should detect fix type for bug-related changes', () => {
      const diff = '+// fix: resolve bug in authentication';
      const filenames = ['auth.js'];

      const type = detectCommitType(diff, filenames);
      expect(type).toBe('fix');
    });

    it('should detect feat type for new features', () => {
      const diff = '+// add new user registration feature';
      const filenames = ['user.js'];

      const type = detectCommitType(diff, filenames);
      expect(type).toBe('feat');
    });

    it('should default to chore for unrecognized changes', () => {
      const diff = '+// some random change';
      const filenames = ['random.js'];

      const type = detectCommitType(diff, filenames);
      expect(type).toBe('chore');
    });
  });

  describe('processOpenAIMessage', () => {
    it('should remove plaintext code block formatting', () => {
      const input =
        '```plaintext\nchore(codecov): remover integração com Codecov\n```';
      const expected = 'chore(codecov): remover integração com Codecov';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should remove javascript code block formatting', () => {
      const input =
        '```javascript\nfeat(auth): adicionar validação de email\n```';
      const expected = 'feat(auth): adicionar validação de email';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should remove typescript code block formatting', () => {
      const input = '```typescript\nfix(ui): corrigir layout responsivo\n```';
      const expected = 'fix(ui): corrigir layout responsivo';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should remove simple code block without language specification', () => {
      const input = '```\nrefactor(core): simplificar estrutura de dados\n```';
      const expected = 'refactor(core): simplificar estrutura de dados';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should handle messages without code blocks', () => {
      const input = 'docs(readme): atualizar documentação';
      const expected = 'docs(readme): atualizar documentação';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should trim extra whitespace and newlines', () => {
      const input = '  \n  test(unit): adicionar testes para cache  \n  ';
      const expected = 'test(unit): adicionar testes para cache';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should handle multiline commit messages within code blocks', () => {
      const input =
        '```\nfeat(auth): adicionar autenticação OAuth\n\n- Integração com Google\n- Validação de tokens\n```';
      const expected =
        'feat(auth): adicionar autenticação OAuth\n\n- Integração com Google\n- Validação de tokens';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should handle code blocks with spaces after language specification', () => {
      const input =
        '```text   \nci(github): configurar workflow de deploy\n```';
      const expected = 'ci(github): configurar workflow de deploy';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should handle empty or whitespace-only messages', () => {
      const input = '```\n   \n```';
      const expected = '';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should handle code blocks without newlines after opening backticks', () => {
      const input = '```feat: implementar login```';
      const expected = 'feat: implementar login';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('should handle code blocks with language and no newlines', () => {
      const input = '```textchore: atualizar dependências```';
      const expected = 'chore: atualizar dependências';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('deve preservar nomes de funções e métodos nas mensagens', () => {
      const input = 'feat(git): adicionar escape de caracteres especiais em mensagens de commit';
      const expected = 'feat(git): adicionar escape de caracteres especiais em mensagens de commit';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('deve preservar nomes de funções com backticks nas mensagens', () => {
      const input = 'feat(auth): implementar função `validateUser` no AuthService';
      const expected = 'feat(auth): implementar função `validateUser` no AuthService';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('deve preservar nomes de classes e métodos com aspas duplas', () => {
      const input = 'fix(service): corrigir método "processPayment" na classe PaymentService';
      const expected = 'fix(service): corrigir método "processPayment" na classe PaymentService';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('deve preservar nomes de arquivos e funções com aspas simples', () => {
      const input = "refactor(core): melhorar função 'calculateTotal' em utils.ts";
      const expected = "refactor(core): melhorar função 'calculateTotal' em utils.ts";

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('deve remover code blocks apenas quando a mensagem inteira está envolvida', () => {
      const inputWrapped = '```\nfeat(api): adicionar endpoint de autenticação\n```';
      const expectedUnwrapped = 'feat(api): adicionar endpoint de autenticação';

      const result = processOpenAIMessage(inputWrapped);
      expect(result).toBe(expectedUnwrapped);
    });

    it('deve preservar code blocks internos quando não envolvem a mensagem inteira', () => {
      const input = 'feat(docs): adicionar exemplo de uso: `commit-wizard --help`';
      const expected = 'feat(docs): adicionar exemplo de uso: `commit-wizard --help`';

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });

    it('deve lidar com mensagens complexas com múltiplos tipos de aspas', () => {
      const input = `feat(git): implementar função "escapeShellArg" para garantir segurança ao usar aspas simples em comandos shell`;
      const expected = `feat(git): implementar função "escapeShellArg" para garantir segurança ao usar aspas simples em comandos shell`;

      const result = processOpenAIMessage(input);
      expect(result).toBe(expected);
    });
  });
});
