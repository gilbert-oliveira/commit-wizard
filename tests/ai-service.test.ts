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