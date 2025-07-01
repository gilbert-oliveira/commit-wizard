import { loadConfig, saveConfig } from '../src/config';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock do fs
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock do os
jest.mock('os');
const mockedOs = os as jest.Mocked<typeof os>;

// Mock do path
jest.mock('path');
const mockedPath = path as jest.Mocked<typeof path>;

describe('Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(false);
    mockedPath.join.mockImplementation((...paths) => paths.join('/'));
    mockedOs.homedir.mockReturnValue('/home/user');
  });

  describe('loadConfig', () => {
    it('deve carregar configuração padrão quando não há arquivo de config', () => {
      const config = loadConfig();
      
      expect(config).toEqual({
        model: 'gpt-4o',
        temperature: 0.2,
        maxTokens: 1000,
        language: 'pt',
        autoCommit: false,
        excludePatterns: ['*.lock*', '*.log', 'node_modules/**'],
        includeEmoji: true,
        apiKey: 'test-api-key', // Do process.env.OPENAI_API_KEY
      });
    });

    it('deve carregar configuração do arquivo local quando existe', () => {
      const mockConfig = {
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        language: 'en',
      };

      mockedFs.existsSync.mockImplementation((filePath) => {
        return filePath === process.cwd() + '/.commit-wizard.json';
      });
      
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const config = loadConfig();
      
      expect(config.model).toBe('gpt-3.5-turbo');
      expect(config.temperature).toBe(0.5);
      expect(config.language).toBe('en');
      expect(config.maxTokens).toBe(1000); // Default mantido
    });

    it('deve usar configuração global quando não há local', () => {
      const mockConfig = {
        model: 'gpt-4-turbo',
        includeEmoji: false,
      };

      mockedFs.existsSync.mockImplementation((filePath) => {
        return filePath === '/home/user/.commit-wizard.json';
      });
      
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const config = loadConfig();
      
      expect(config.model).toBe('gpt-4-turbo');
      expect(config.includeEmoji).toBe(false);
    });

    it('deve lidar com erro ao ler arquivo de configuração', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Erro de leitura');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const config = loadConfig();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(config.model).toBe('gpt-4o'); // Deve usar padrão
    });
  });

  describe('saveConfig', () => {
    it('deve salvar configuração local por padrão', () => {
      const newConfig = { model: 'gpt-3.5-turbo' };
      
      saveConfig(newConfig);
      
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.commit-wizard.json'),
        expect.stringContaining('"model": "gpt-3.5-turbo"')
      );
    });

    it('deve salvar configuração global quando especificado', () => {
      const newConfig = { temperature: 0.8 };
      
      saveConfig(newConfig, true);
      
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        '/home/user/.commit-wizard.json',
        expect.stringContaining('"temperature": 0.8')
      );
    });

    it('não deve salvar apiKey no arquivo', () => {
      const newConfig = { apiKey: 'secret-key', model: 'gpt-4o' };
      
      saveConfig(newConfig);
      
      const savedContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
      expect(savedContent).not.toContain('apiKey');
      expect(savedContent).toContain('gpt-4o');
    });

    it('deve lidar com erro ao salvar', () => {
      mockedFs.writeFileSync.mockImplementation(() => {
        throw new Error('Erro de escrita');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      saveConfig({ model: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Erro ao salvar configuração:',
        expect.any(Error)
      );
    });
  });
}); 