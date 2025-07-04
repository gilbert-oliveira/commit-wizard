import { AIService } from '../src/ai-service';
import { Config } from '../src/config';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('AIService', () => {
  let config: Config;
  let aiService: AIService;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key',
      model: 'gpt-4o',
      temperature: 0.2,
      maxTokens: 1000,
      language: 'pt',
      autoCommit: false,
      excludePatterns: [],
      includeEmoji: true,
    };
    aiService = new AIService(config);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('deve criar instância com configuração', () => {
      expect(aiService).toBeInstanceOf(AIService);
    });
  });

  describe('callOpenAI', () => {
    it('deve fazer chamada para API OpenAI com sucesso', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'feat: test commit' } }],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await aiService.callOpenAI('test diff', 'commit');

      expect(result.content).toBe('feat: test commit');
      expect(result.usage).toEqual({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
        })
      );
    });

    it('deve lançar erro quando API key não está configurada', async () => {
      const configSemApiKey = { ...config, apiKey: undefined };
      const aiServiceSemApiKey = new AIService(configSemApiKey);

      await expect(aiServiceSemApiKey.callOpenAI('test')).rejects.toThrow(
        'API key da OpenAI não configurada'
      );
    });

    it('deve lançar erro quando API retorna erro', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid API key' },
        }),
        statusText: 'Unauthorized',
      };

      mockFetch.mockResolvedValue(mockResponse);

      await expect(aiService.callOpenAI('test')).rejects.toThrow(
        'Erro na API OpenAI (401): Invalid API key'
      );
    });

    it('deve usar configurações corretas para idioma inglês', async () => {
      const configEn = { ...config, language: 'en' as const };
      const aiServiceEn = new AIService(configEn);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'feat: test commit' } }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await aiServiceEn.callOpenAI('test diff', 'commit');

      const callArgs = mockFetch.mock.calls[0][1] as any;
      const body = JSON.parse(callArgs.body);

      expect(body.messages[0].content).toContain('English');
    });

    it('deve incluir emojis quando configurado', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'feat: test commit' } }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await aiService.callOpenAI('test diff', 'commit');

      const callArgs = mockFetch.mock.calls[0][1] as any;
      const body = JSON.parse(callArgs.body);

      expect(body.messages[1].content).toContain('emojis apropriados');
    });

    it('deve não incluir emojis quando desabilitado', async () => {
      const configSemEmoji = { ...config, includeEmoji: false };
      const aiServiceSemEmoji = new AIService(configSemEmoji);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'feat: test commit' } }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await aiServiceSemEmoji.callOpenAI('test diff', 'commit');

      const callArgs = mockFetch.mock.calls[0][1] as any;
      const body = JSON.parse(callArgs.body);

      expect(body.messages[1].content).toContain('Não inclua emojis');
    });
  });

  describe('cleanApiResponse', () => {
    it('deve remover dados de cobertura da resposta da API', async () => {
      const dirtyResponse = `feat: adiciona nova funcionalidade

Esta funcionalidade adiciona suporte para X
---------------------|---------|----------|---------|---------|------------------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|----------|---------|---------|------------------------------
All files            |   82.75 |    85.71 |      84 |      83 |
ai-service.ts        |   89.74 |    78.26 |      75 |   94.59 | 161,167`;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: dirtyResponse } }],
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await aiService.callOpenAI('test diff', 'commit');

      expect(result.content).not.toContain('% Stmts');
      expect(result.content).not.toContain('All files');
      expect(result.content).not.toContain('ai-service.ts');
      expect(result.content).not.toContain('161,167');
      expect(result.content).toContain('feat: adiciona nova funcionalidade');
      expect(result.content).toContain('Esta funcionalidade adiciona suporte para X');
    });

    it('deve remover blocos de código markdown', async () => {
      const responseWithCode = `feat: adiciona nova funcionalidade

\`\`\`typescript
const test = 'code block';
\`\`\`

Esta funcionalidade adiciona suporte para X`;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: responseWithCode } }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await aiService.callOpenAI('test diff', 'commit');

      expect(result.content).not.toContain('```');
      expect(result.content).not.toContain('const test = \'code block\';');
      expect(result.content).toContain('feat: adiciona nova funcionalidade');
      expect(result.content).toContain('Esta funcionalidade adiciona suporte para X');
    });

    it('deve lançar erro para resposta vazia', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '' } }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await expect(aiService.callOpenAI('test diff', 'commit')).rejects.toThrow('Resposta da API está vazia');
    });

    it('deve lançar erro para mensagem inválida após limpeza', async () => {
      const invalidResponse = `
---------------------|---------|----------|---------|---------|------------------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|----------|---------|---------|------------------------------
All files            |   82.75 |    85.71 |      84 |      83 |`;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: invalidResponse } }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      await expect(aiService.callOpenAI('test diff', 'commit')).rejects.toThrow('Mensagem de commit vazia após limpeza');
    });

    it('deve preservar mensagem de commit válida', async () => {
      const validResponse = `feat: adiciona nova funcionalidade

Esta funcionalidade adiciona suporte para autenticação OAuth2
com integração ao Google e GitHub.

BREAKING CHANGE: A API de autenticação foi alterada`;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: validResponse } }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await aiService.callOpenAI('test diff', 'commit');

      expect(result.content).toContain('feat: adiciona nova funcionalidade');
      expect(result.content).toContain('OAuth2');
      expect(result.content).toContain('BREAKING CHANGE');
    });
  });

  describe('generateSummary', () => {
    it('deve gerar resumo de chunk', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'adiciona nova funcionalidade' } }],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await aiService.generateSummary('diff chunk');

      expect(result).toBe('adiciona nova funcionalidade');
      
      const callArgs = mockFetch.mock.calls[0][1] as any;
      const body = JSON.parse(callArgs.body);
      expect(body.messages[1].content).toContain('resumo breve');
    });
  });

  describe('generateCommitMessage', () => {
    it('deve gerar mensagem de commit', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'feat: adiciona nova feature' } }],
          usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const result = await aiService.generateCommitMessage('diff content');

      expect(result.content).toBe('feat: adiciona nova feature');
      expect(result.usage?.totalTokens).toBe(300);
    });
  });
}); 