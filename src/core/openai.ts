import type { Config } from '../config/index';

export interface CommitSuggestion {
  message: string;
  type:
    | 'feat'
    | 'fix'
    | 'docs'
    | 'style'
    | 'refactor'
    | 'test'
    | 'chore'
    | 'build'
    | 'ci';
  confidence: number;
}

export interface OpenAIResponse {
  success: boolean;
  suggestion?: CommitSuggestion;
  error?: string;
}

/**
 * Constrói o prompt para a OpenAI baseado no diff e configurações (otimizado)
 */
export function buildPrompt(
  diff: string,
  config: Config,
  filenames: string[]
): string {
  const language = config.language === 'pt' ? 'português' : 'english';
  const styleInstructions = getStyleInstructions(
    config.commitStyle,
    config.language
  );

  // Limitar tamanho do diff para economizar tokens
  const maxDiffLength = 6000;
  const truncatedDiff =
    diff.length > maxDiffLength
      ? diff.substring(0, maxDiffLength) + '\n... (diff truncado)'
      : diff;

  // Simplificar lista de arquivos se houver muitos
  const fileList =
    filenames.length > 10
      ? `${filenames.length} arquivos: ${filenames.slice(0, 5).join(', ')}...`
      : filenames.join(', ');

  const prompt = `Gere mensagem de commit em ${language} (${config.commitStyle}).

Arquivos: ${fileList}

${styleInstructions}

Diff:
\`\`\`
${truncatedDiff}
\`\`\`

Mensagem:`;

  return prompt;
}

/**
 * Obtém instruções específicas baseadas no estilo de commit
 */
function getStyleInstructions(style: string, language: string): string {
  const instructions = {
    pt: {
      conventional: `- Use formato: tipo(escopo): descrição
- Tipos válidos: feat, fix, docs, style, refactor, test, chore, build, ci
- Exemplo: "feat(auth): adicionar validação de email"
- Mantenha a primeira linha com até 50 caracteres`,

      simple: `- Use formato simples e direto
- Comece com verbo no infinitivo
- Exemplo: "corrigir validação de formulário"
- Máximo 50 caracteres`,

      detailed: `- Primeira linha: resumo em até 50 caracteres
- Se necessário, adicione corpo explicativo
- Use presente do indicativo
- Seja descritivo mas conciso`,
    },
    en: {
      conventional: `- Use format: type(scope): description
- Valid types: feat, fix, docs, style, refactor, test, chore, build, ci
- Example: "feat(auth): add email validation"
- Keep first line under 50 characters`,

      simple: `- Use simple and direct format
- Start with imperative verb
- Example: "fix form validation"
- Maximum 50 characters`,

      detailed: `- First line: summary under 50 characters
- Add explanatory body if needed
- Use imperative mood
- Be descriptive but concise`,
    },
  };

  const lang = language === 'pt' ? 'pt' : 'en';
  return (
    instructions[lang][style as keyof typeof instructions.pt] ||
    instructions[lang].conventional
  );
}

/**
 * Extrai o tipo de commit da mensagem gerada pela OpenAI
 */
export function extractCommitTypeFromMessage(
  message: string
): CommitSuggestion['type'] | null {
  // Padrões para detectar tipos de commit
  const typePatterns = {
    feat: /^(feat|feature)(\([^)]+\))?:/i,
    fix: /^(fix|bugfix)(\([^)]+\))?:/i,
    docs: /^(docs|documentation)(\([^)]+\))?:/i,
    style: /^(style|format)(\([^)]+\))?:/i,
    refactor: /^(refactor|refactoring)(\([^)]+\))?:/i,
    test: /^(test|testing)(\([^)]+\))?:/i,
    chore: /^(chore|maintenance)(\([^)]+\))?:/i,
    build: /^(build|ci)(\([^)]+\))?:/i,
    ci: /^(ci|continuous-integration)(\([^)]+\))?:/i,
  };

  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(message)) {
      return type as CommitSuggestion['type'];
    }
  }

  return null;
}

/**
 * Detecta o tipo de commit baseado no diff
 */
export function detectCommitType(
  diff: string,
  filenames: string[]
): CommitSuggestion['type'] {
  const diffLower = diff.toLowerCase();
  const filesStr = filenames.join(' ').toLowerCase();

  // Testes
  if (
    filesStr.includes('test') ||
    filesStr.includes('spec') ||
    diffLower.includes('test(')
  ) {
    return 'test';
  }

  // Documentação
  if (
    filesStr.includes('readme') ||
    filesStr.includes('.md') ||
    filesStr.includes('docs')
  ) {
    return 'docs';
  }

  // Build/CI
  if (
    filesStr.includes('package.json') ||
    filesStr.includes('dockerfile') ||
    filesStr.includes('.yml') ||
    filesStr.includes('.yaml') ||
    filesStr.includes('webpack') ||
    filesStr.includes('tsconfig')
  ) {
    return 'build';
  }

  // Styles
  if (
    filesStr.includes('.css') ||
    filesStr.includes('.scss') ||
    diffLower.includes('style') ||
    diffLower.includes('format')
  ) {
    return 'style';
  }

  // Fixes
  if (
    diffLower.includes('fix') ||
    diffLower.includes('bug') ||
    diffLower.includes('error') ||
    diffLower.includes('issue')
  ) {
    return 'fix';
  }

  // Features (padrão para novas funcionalidades)
  if (
    diffLower.includes('add') ||
    diffLower.includes('new') ||
    diffLower.includes('create') ||
    diffLower.includes('implement')
  ) {
    return 'feat';
  }

  // Refactor
  if (
    diffLower.includes('refactor') ||
    diffLower.includes('restructure') ||
    diffLower.includes('rename')
  ) {
    return 'refactor';
  }

  // Default
  return 'chore';
}

/**
 * Processa a mensagem retornada pela OpenAI removendo formatação desnecessária
 */
export function processOpenAIMessage(message: string): string {
  // Remover backticks de código APENAS se a mensagem inteira está envolvida em backticks
  // Isso preserva nomes de funções, métodos e variáveis dentro da mensagem
  if (message.match(/^```[\s\S]*```$/)) {
    // Se a mensagem inteira está em um bloco de código, remover as marcações
    message = message
      .replace(/^```(?:plaintext|javascript|typescript|python|java|html|css|json|xml|yaml|yml|bash|shell|text)?\s*/, '')
      .replace(/\s*```$/, '');
  }

  // Remover quebras de linha extras do início e fim
  message = message.trim();

  return message;
}

/**
 * Consome a API da OpenAI para gerar mensagem de commit
 */
export async function generateCommitMessage(
  diff: string,
  config: Config,
  filenames: string[]
): Promise<OpenAIResponse> {
  try {
    if (!config.openai.apiKey) {
      return {
        success: false,
        error:
          'Chave da OpenAI não encontrada. Configure OPENAI_API_KEY nas variáveis de ambiente.',
      };
    }

    const prompt = buildPrompt(diff, config, filenames);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: Math.min(config.openai.maxTokens, 150), // Limitar para economizar tokens
        temperature: config.openai.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      return {
        success: false,
        error: `Erro da OpenAI (${response.status}): ${errorData.error?.message || 'Erro desconhecido'}`,
      };
    }

    const data = (await response.json()) as any;
    let message = data.choices?.[0]?.message?.content?.trim();

    if (!message) {
      return {
        success: false,
        error: 'OpenAI retornou resposta vazia',
      };
    }

    // Processar mensagem para remover formatação
    message = processOpenAIMessage(message);

    // Extrair tipo da mensagem gerada pela OpenAI
    const extractedType = extractCommitTypeFromMessage(message);
    const fallbackType = detectCommitType(diff, filenames);

    return {
      success: true,
      suggestion: {
        message,
        type: extractedType || fallbackType,
        confidence: 0.8, // Placeholder - pode ser melhorado
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro ao conectar com OpenAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Gera mensagem com retry em caso de falha
 */
export async function generateWithRetry(
  diff: string,
  config: Config,
  filenames: string[],
  maxRetries: number = 3
): Promise<OpenAIResponse> {
  let lastError = '';

  for (let i = 0; i < maxRetries; i++) {
    const result = await generateCommitMessage(diff, config, filenames);

    if (result.success) {
      return result;
    }

    lastError = result.error || 'Erro desconhecido';

    // Aguardar antes de tentar novamente (exponential backoff)
    if (i < maxRetries - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  return {
    success: false,
    error: `Falha após ${maxRetries} tentativas. Último erro: ${lastError}`,
  };
}
