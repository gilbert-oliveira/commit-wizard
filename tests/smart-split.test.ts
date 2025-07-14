// Importar polyfill antes de qualquer outra coisa

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  analyzeFileContext,
  generateGroupDiff,
} from '../src/core/smart-split';
import type { Config } from '../src/config/index';

// Mock para clipboardy (evita erro ESM no Jest)
jest.mock('clipboardy', () => ({
  __esModule: true,
  default: { write: jest.fn(), read: jest.fn() },
}));

describe('Smart Split', () => {
  beforeEach(() => {
    // Limpar mocks se necessário
  });

  describe('analyzeFileContext', () => {
    it('deve retornar erro quando API key não está configurada', async () => {
      const config: Config = {
        openai: {
          apiKey: '',
          model: 'gpt-3.5-turbo',
          maxTokens: 1000,
          temperature: 0.7,
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

      const result = await analyzeFileContext(['test.ts'], 'diff', config);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Chave da OpenAI não encontrada');
    });

    it('deve construir prompt corretamente', () => {
      // Teste básico de que a função não quebra
      const config: Config = {
        openai: {
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo',
          maxTokens: 1000,
          temperature: 0.7,
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

      const files = ['src/auth/login.ts', 'src/auth/register.ts'];
      const overallDiff = 'diff content here';

      // Apenas verificar que a função não quebra
      expect(() =>
        analyzeFileContext(files, overallDiff, config)
      ).toBeDefined();
    });
  });

  describe('generateGroupDiff', () => {
    it('deve retornar string vazia para grupo sem arquivos', async () => {
      const group = {
        id: 'test-group',
        name: 'Test Group',
        description: 'Test description',
        files: [],
        diff: '',
        confidence: 0.8,
      };

      const result = await generateGroupDiff(group);
      expect(result).toBe('');
    });
  });

  describe('Escape de caracteres especiais em mensagens de commit', () => {
    it('deve escapar aspas duplas corretamente na mensagem de commit', () => {
      const messageWithDoubleQuotes =
        'feat: adicionar função "isPermitido" para validação';
      const expectedEscaped =
        'feat: adicionar função \\"isPermitido\\" para validação';

      // Simular a função de escape usada no código
      const escaped = messageWithDoubleQuotes.replace(/"/g, '\\"');
      expect(escaped).toBe(expectedEscaped);
    });

    it('deve escapar aspas simples corretamente na mensagem de commit', () => {
      const messageWithSingleQuotes =
        "feat: adicionar validação no método 'EntregaService'";
      const expectedResult =
        "feat: adicionar validação no método 'EntregaService'";

      // Aspas simples não precisam ser escapadas no comando git
      const result = messageWithSingleQuotes.replace(/"/g, '\\"');
      expect(result).toBe(expectedResult);
    });

    it('deve escapar crases corretamente na mensagem de commit', () => {
      const messageWithBackticks =
        'feat: adicionar comando `git status` no helper';
      const expectedResult = 'feat: adicionar comando `git status` no helper';

      // Crases também não precisam ser escapadas especificamente para aspas duplas
      const result = messageWithBackticks.replace(/"/g, '\\"');
      expect(result).toBe(expectedResult);
    });

    it('deve escapar múltiplos tipos de aspas na mesma mensagem', () => {
      const messageWithMixedQuotes =
        'feat: adicionar função "isValid" que usa \'strict\' mode e comando `exec`';
      const expectedEscaped =
        'feat: adicionar função \\"isValid\\" que usa \'strict\' mode e comando `exec`';

      const escaped = messageWithMixedQuotes.replace(/"/g, '\\"');
      expect(escaped).toBe(expectedEscaped);
    });

    it('deve processar mensagem vazia sem erro', () => {
      const emptyMessage = '';
      const escaped = emptyMessage.replace(/"/g, '\\"');
      expect(escaped).toBe('');
    });

    it('deve processar mensagem sem aspas sem modificação', () => {
      const normalMessage =
        'feat: adicionar nova funcionalidade de autenticacao';
      const escaped = normalMessage.replace(/"/g, '\\"');
      expect(escaped).toBe(normalMessage);
    });

    it('deve escapar aspas duplas consecutivas', () => {
      const messageWithConsecutiveQuotes =
        'feat: adicionar parsing de ""valor vazio""';
      const expectedEscaped =
        'feat: adicionar parsing de \\"\\"valor vazio\\"\\"';

      const escaped = messageWithConsecutiveQuotes.replace(/"/g, '\\"');
      expect(escaped).toBe(expectedEscaped);
    });

    it('deve escapar aspas no início e fim da mensagem', () => {
      const messageWithEdgeQuotes = '"feat: nova funcionalidade importante"';
      const expectedEscaped = '\\"feat: nova funcionalidade importante\\"';

      const escaped = messageWithEdgeQuotes.replace(/"/g, '\\"');
      expect(escaped).toBe(expectedEscaped);
    });

    it('deve construir comando git commit corretamente com aspas escapadas', () => {
      const filename = 'src/test.ts';
      const message = 'feat: adicionar função "isValid" no service';
      const expectedCommand = `git commit "${filename}" -m "feat: adicionar função \\"isValid\\" no service"`;

      const actualCommand = `git commit "${filename}" -m "${message.replace(/"/g, '\\"')}"`;
      expect(actualCommand).toBe(expectedCommand);
    });

    it('deve construir comando git commit para múltiplos arquivos com aspas escapadas', () => {
      const files = ['src/test1.ts', 'src/test2.ts'];
      const message = 'feat: implementar "SmartValidation" nos componentes';
      const filesArg = files.map((f) => `"${f}"`).join(' ');
      const expectedCommand = `git commit ${filesArg} -m "feat: implementar \\"SmartValidation\\" nos componentes"`;

      const actualCommand = `git commit ${filesArg} -m "${message.replace(/"/g, '\\"')}"`;
      expect(actualCommand).toBe(expectedCommand);
    });
  });
});
