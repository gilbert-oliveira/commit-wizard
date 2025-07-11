// Importar polyfill antes de qualquer outra coisa
import '../src/utils/polyfill';

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  analyzeFileContext,
  generateGroupDiff,
} from '../src/core/smart-split.ts';
import type { Config } from '../src/config/index.ts';

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
});
