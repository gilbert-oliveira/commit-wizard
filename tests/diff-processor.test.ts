import { DiffProcessor } from '../src/diff-processor';
import { AIService } from '../src/ai-service';
import { Config } from '../src/config';

// Mock do ora
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: '',
  }));
});

// Mock do gpt-tokenizer
jest.mock('gpt-tokenizer', () => ({
  encode: jest.fn((text: string) => new Array(Math.max(1, Math.floor(text.length / 4))).fill(0)), // Simula tokens
  decode: jest.fn((_tokens: number[]) => 'decoded text'),
}));

describe('DiffProcessor', () => {
  let aiService: AIService;
  let diffProcessor: DiffProcessor;
  let config: Config;

  beforeEach(() => {
    config = {
      apiKey: 'test-key',
      model: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 1000,
      language: 'pt',
      autoCommit: false,
      excludePatterns: [],
      includeEmoji: true,
    };
    
    aiService = new AIService(config);
    diffProcessor = new DiffProcessor(aiService, 100); // maxTokens baixo para testar chunks
    
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('deve criar instância com configurações', () => {
      expect(diffProcessor).toBeInstanceOf(DiffProcessor);
    });
  });

  describe('chunkDiff', () => {
    it('deve retornar diff único quando menor que maxTokens', () => {
      const smallDiff = 'pequeno diff';
      const chunks = diffProcessor.chunkDiff(smallDiff);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(smallDiff);
    });

    it('deve dividir diff grande em múltiplos chunks', () => {
      // Cria um diff grande simulando texto longo
      const largeDiff = 'a'.repeat(1000); // diff maior que maxTokens
      const chunks = diffProcessor.chunkDiff(largeDiff);
      
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('analyzeDiffComplexity', () => {
    it('deve analisar diff simples', () => {
      const simpleDiff = `diff --git a/file.ts b/file.ts
+const test = 'simple';`;

      const analysis = diffProcessor.analyzeDiffComplexity(simpleDiff);
      
      expect(analysis.complexity).toBe('simple');
      expect(analysis.fileCount).toBe(1);
      expect(analysis.tokenCount).toBeGreaterThan(0);
      expect(analysis.lineCount).toBeGreaterThan(0);
    });

    it('deve detectar complexidade moderada', () => {
      const moderateDiff = `diff --git a/file1.ts b/file1.ts
+lots of content here
diff --git a/file2.ts b/file2.ts
+more content
diff --git a/file3.ts b/file3.ts
+even more content
diff --git a/file4.ts b/file4.ts
+and more`;

      const analysis = diffProcessor.analyzeDiffComplexity(moderateDiff);
      
      expect(analysis.complexity).toBe('moderate');
      expect(analysis.fileCount).toBe(4);
    });
  });

  describe('extractDiffStats', () => {
    it('deve extrair estatísticas do diff', () => {
      const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
@@ -1,3 +1,4 @@
 const a = 1;
-const b = 2;
+const b = 3;
+const c = 4;
diff --git a/test.js b/test.js
+console.log('new file');`;

      const stats = diffProcessor.extractDiffStats(diff);
      
      expect(stats.additions).toBe(3); // +const b = 3; +const c = 4; +console.log
      expect(stats.deletions).toBe(1); // -const b = 2;
      expect(stats.files).toEqual(['test.ts', 'test.js']);
      expect(stats.types).toEqual(expect.arrayContaining(['ts', 'js']));
    });

    it('deve lidar com diff sem mudanças', () => {
      const diff = '';
      const stats = diffProcessor.extractDiffStats(diff);
      
      expect(stats.additions).toBe(0);
      expect(stats.deletions).toBe(0);
      expect(stats.files).toEqual([]);
      expect(stats.types).toEqual([]);
    });
  });

  describe('detectBreakingChanges', () => {
    it('deve detectar breaking changes óbvias', () => {
      const breakingDiff = `
export class MyClass {
  constructor(param: string) {}
}

export interface MyInterface {
  method(): void;
}

BREAKING CHANGE: API alterada
`;

      const hasBreaking = diffProcessor.detectBreakingChanges(breakingDiff);
      expect(hasBreaking).toBe(true);
    });

    it('deve detectar exports alterados', () => {
      const diff = `
-export function oldFunction() {}
+export function newFunction() {}
`;

      const hasBreaking = diffProcessor.detectBreakingChanges(diff);
      expect(hasBreaking).toBe(true);
    });

    it('deve não detectar breaking changes em diff simples', () => {
      const diff = `
+const internal = 'value';
+// comment added
`;

      const hasBreaking = diffProcessor.detectBreakingChanges(diff);
      expect(hasBreaking).toBe(false);
    });
  });

  describe('processLargeDiff', () => {
    it('deve retornar diff pequeno sem processamento', async () => {
      const smallDiff = 'pequeno diff';
      
      const result = await diffProcessor.processLargeDiff(smallDiff);
      
      expect(result).toBe(smallDiff);
    });

    it('deve processar diff grande em chunks', async () => {
      // Mock do generateSummary
      jest.spyOn(aiService, 'generateSummary').mockResolvedValue('resumo do chunk');
      
      const largeDiff = 'a'.repeat(1000); // Diff grande que será dividido
      
      const result = await diffProcessor.processLargeDiff(largeDiff);
      
      expect(aiService.generateSummary).toHaveBeenCalled();
      expect(result).toContain('resumo do chunk');
    });

    it('deve lidar com erro no processamento', async () => {
      jest.spyOn(aiService, 'generateSummary').mockRejectedValue(new Error('API Error'));
      
      const largeDiff = 'a'.repeat(1000);
      
      await expect(diffProcessor.processLargeDiff(largeDiff)).rejects.toThrow('API Error');
    });
  });
}); 