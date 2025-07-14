import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  initializeCache,
  getCachedAnalysis,
  setCachedAnalysis,
  clearCache,
  getCacheStats,
} from '../src/core/cache';
import type { Config } from '../src/config/index';
import type { FileGroup } from '../src/core/smart-split';

describe('Cache Module', () => {
  const mockConfig: Config = {
    openai: {
      model: 'gpt-4o',
      maxTokens: 150,
      temperature: 0.7,
      apiKey: 'test-key',
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
      ttl: 60, // 1 hora
      maxSize: 10,
    },
  };

  const mockGroups: FileGroup[] = [
    {
      id: 'test-group-1',
      name: 'Test Group 1',
      description: 'Test description',
      files: ['file1.ts', 'file2.ts'],
      diff: '',
      confidence: 0.8,
    },
  ];

  beforeEach(() => {
    // Limpar cache antes de cada teste
    clearCache();
  });

  describe('initializeCache', () => {
    it('should initialize cache with config', () => {
      initializeCache(mockConfig);
      const stats = getCacheStats();

      expect(stats).toBeDefined();
      expect(stats?.enabled).toBe(true);
      expect(stats?.maxSize).toBe(10);
      expect(stats?.size).toBe(0);
    });

    it('should handle disabled cache', () => {
      const disabledConfig = {
        ...mockConfig,
        cache: { ...mockConfig.cache, enabled: false },
      };
      initializeCache(disabledConfig);

      const result = getCachedAnalysis(['file1.ts'], 'test diff');
      expect(result.hit).toBe(false);
    });
  });

  describe('getCachedAnalysis', () => {
    it('should return cache miss when no entry exists', () => {
      initializeCache(mockConfig);

      const result = getCachedAnalysis(['file1.ts'], 'test diff');
      expect(result.hit).toBe(false);
      expect(result.groups).toBeUndefined();
    });

    it('should return cache hit when entry exists', () => {
      initializeCache(mockConfig);

      // Armazenar no cache
      setCachedAnalysis(['file1.ts'], 'test diff', mockGroups);

      // Verificar cache hit
      const result = getCachedAnalysis(['file1.ts'], 'test diff');
      expect(result.hit).toBe(true);
      expect(result.groups).toBeDefined();
      expect(result.groups).toEqual(mockGroups);
    });

    it('should handle different contexts as separate entries', () => {
      initializeCache(mockConfig);

      // Armazenar duas análises diferentes
      setCachedAnalysis(['file1.ts'], 'diff1', mockGroups);
      setCachedAnalysis(['file2.ts'], 'diff2', mockGroups);

      // Verificar que são entradas separadas
      const result1 = getCachedAnalysis(['file1.ts'], 'diff1');
      const result2 = getCachedAnalysis(['file2.ts'], 'diff2');
      const result3 = getCachedAnalysis(['file1.ts'], 'diff2'); // Diferente

      expect(result1.hit).toBe(true);
      expect(result2.hit).toBe(true);
      expect(result3.hit).toBe(false);
    });

    it('should be case sensitive for file names', () => {
      initializeCache(mockConfig);

      setCachedAnalysis(['File1.ts'], 'test diff', mockGroups);

      const result = getCachedAnalysis(['file1.ts'], 'test diff');
      expect(result.hit).toBe(false);
    });
  });

  describe('setCachedAnalysis', () => {
    it('should store analysis in cache', () => {
      initializeCache(mockConfig);

      setCachedAnalysis(['file1.ts'], 'test diff', mockGroups);

      const stats = getCacheStats();
      expect(stats?.size).toBe(1);
    });

    it('should not store when cache is disabled', () => {
      const disabledConfig = {
        ...mockConfig,
        cache: { ...mockConfig.cache, enabled: false },
      };
      initializeCache(disabledConfig);

      setCachedAnalysis(['file1.ts'], 'test diff', mockGroups);

      const stats = getCacheStats();
      expect(stats?.size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return correct stats', () => {
      initializeCache(mockConfig);

      const stats = getCacheStats();
      expect(stats).toEqual({
        size: 0,
        maxSize: 10,
        enabled: true,
      });
    });

    it('should return null when cache not initialized', () => {
      clearCache();
      const stats = getCacheStats();
      expect(stats).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', () => {
      initializeCache(mockConfig);

      setCachedAnalysis(['file1.ts'], 'test diff', mockGroups);
      setCachedAnalysis(['file2.ts'], 'test diff2', mockGroups);

      expect(getCacheStats()?.size).toBe(2);

      clearCache();

      expect(getCacheStats()).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect TTL configuration', () => {
      const shortTTLConfig = {
        ...mockConfig,
        cache: { ...mockConfig.cache, ttl: 1 },
      }; // 1 minuto
      initializeCache(shortTTLConfig);

      setCachedAnalysis(['file1.ts'], 'test diff', mockGroups);

      // Simular passagem de tempo (mais de 1 minuto)
      const originalDateNow = Date.now;
      Date.now = () => originalDateNow() + 2 * 60 * 1000; // +2 minutos

      const result = getCachedAnalysis(['file1.ts'], 'test diff');
      expect(result.hit).toBe(false);

      // Restaurar Date.now
      Date.now = originalDateNow;
    });
  });

  describe('Max Size', () => {
    it('should respect max size configuration', () => {
      const smallCacheConfig = {
        ...mockConfig,
        cache: { ...mockConfig.cache, maxSize: 2 },
      };
      initializeCache(smallCacheConfig);

      // Adicionar 3 entradas (excede maxSize de 2)
      setCachedAnalysis(['file1.ts'], 'diff1', mockGroups);
      setCachedAnalysis(['file2.ts'], 'diff2', mockGroups);
      setCachedAnalysis(['file3.ts'], 'diff3', mockGroups);

      const stats = getCacheStats();
      expect(stats?.size).toBeLessThanOrEqual(2);
    });
  });
});
