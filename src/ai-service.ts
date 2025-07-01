import { Config } from './config.js';

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Serviço para interação com APIs de IA
 */
export class AIService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Gera prompt do sistema baseado no modo e linguagem
   */
  private getSystemPrompt(mode: 'commit' | 'summary'): string {
    const isPortuguese = this.config.language === 'pt';

    if (mode === 'commit') {
      return isPortuguese
        ? 'Você é um assistente que gera mensagens de commit seguindo a convenção do Conventional Commits. Use linguagem imperativa em português.'
        : 'You are an assistant that generates commit messages following the Conventional Commits convention. Use imperative language in English.';
    }

    return isPortuguese
      ? 'Você é um assistente que resume alterações de código de forma breve, usando linguagem imperativa em português.'
      : 'You are an assistant that summarizes code changes briefly, using imperative language in English.';
  }

  /**
   * Gera prompt para mensagem de commit
   */
  private getCommitPrompt(): string {
    const isPortuguese = this.config.language === 'pt';

    if (isPortuguese) {
      return `
Por favor, escreva a mensagem de commit para este diff usando a convenção de Conventional Commits.
A mensagem deve começar com um tipo de commit, como:
  feat: para novas funcionalidades
  fix: para correções de bugs
  chore: para alterações que não afetam a funcionalidade
  docs: para mudanças na documentação
  style: para alterações no estilo do código (formatação)
  refactor: para alterações no código que não alteram a funcionalidade
  perf: para melhorias de desempenho
  test: para alterações nos testes
  ci: para mudanças no pipeline de integração contínua

${this.config.includeEmoji ? 'Inclua emojis apropriados no início da mensagem.' : 'Não inclua emojis na mensagem.'}

Para breaking changes, use "!" após o tipo: feat!(auth): reestruturar fluxo de login

Use sempre linguagem imperativa, como:
  - "adiciona recurso"
  - "corrige bug"  
  - "remove arquivo"

Mantenha a mensagem concisa mas informativa.
`;
    }

    return `
Please write the commit message for this diff using the Conventional Commits convention.
The message should start with a commit type, such as:
  feat: for new features
  fix: for bug fixes
  chore: for changes that don't affect functionality
  docs: for documentation changes
  style: for code style changes (formatting)
  refactor: for code changes that don't alter functionality
  perf: for performance improvements
  test: for test changes
  ci: for CI pipeline changes

${this.config.includeEmoji ? 'Include appropriate emojis at the beginning of the message.' : 'Do not include emojis in the message.'}

For breaking changes, use "!" after the type: feat!(auth): restructure login flow

Always use imperative language, such as:
  - "add feature"
  - "fix bug"
  - "remove file"

Keep the message concise but informative.
`;
  }

  /**
   * Realiza chamada para a API da OpenAI
   */
  async callOpenAI(prompt: string, mode: 'commit' | 'summary' = 'commit'): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('API key da OpenAI não configurada');
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const systemPrompt = this.getSystemPrompt(mode);
    const fullPrompt =
      mode === 'commit' ? `${this.getCommitPrompt()}\n\nDiff:\n\n${prompt}` : prompt;

    const body = {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt },
      ],
      temperature: this.config.temperature,
      max_tokens: 500, // Limite para mensagens de commit
    };

    try {
      // Timeout de 30 segundos para evitar travamentos
      const controller = new AbortController();
      const timeoutId = globalThis.setTimeout(() => controller.abort(), 30000);

      const response = await (globalThis as any).fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      globalThis.clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Erro na API OpenAI (${response.status}): ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content.trim().replace(/```/g, ''),
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(
            'Timeout: A requisição demorou mais de 30 segundos. Tente reduzir o tamanho do diff ou verificar sua conexão.'
          );
        }
        throw error;
      }
      throw new Error(`Erro desconhecido ao chamar API: ${error}`);
    }
  }

  /**
   * Gera resumo de um chunk de diff
   */
  async generateSummary(chunk: string): Promise<string> {
    const isPortuguese = this.config.language === 'pt';
    const summaryPrefix = isPortuguese
      ? 'A partir do diff abaixo, extraia um resumo breve das alterações (use linguagem imperativa):'
      : 'From the diff below, extract a brief summary of the changes (use imperative language):';

    const prompt = `${summaryPrefix}\n\n${chunk}`;
    const response = await this.callOpenAI(prompt, 'summary');
    return response.content;
  }

  /**
   * Gera mensagem de commit baseada no diff ou resumo
   */
  async generateCommitMessage(diffOrSummary: string): Promise<AIResponse> {
    return this.callOpenAI(diffOrSummary, 'commit');
  }
}
