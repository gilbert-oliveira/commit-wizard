import { existsSync, readFileSync } from 'fs';
import fs from 'fs';
import { join } from 'path';
// Removido: import dotenv from 'dotenv';

// Removido: dotenv.config();

export interface Config {
  openai: {
    model: string;
    maxTokens: number;
    temperature: number;
    apiKey?: string;
    timeout: number;
    retries: number;
  };
  language: string;
  commitStyle: 'conventional' | 'simple' | 'detailed';
  autoCommit: boolean;
  splitCommits: boolean;
  dryRun: boolean;
  smartSplit: {
    enabled: boolean;
    minGroupSize: number;
    maxGroups: number;
    confidenceThreshold: number;
  };
  cache: {
    enabled: boolean;
    ttl: number; // Time to live em minutos
    maxSize: number; // Número máximo de entradas
  };
}

const DEFAULT_CONFIG: Config = {
  openai: {
    model: 'gpt-4o',
    maxTokens: 150,
    temperature: 0.7,
    timeout: 30000, // 30 segundos
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
    maxSize: 100,
  },
};

// Adicionar interface para userConfig
interface UserConfig {
  openai?: Partial<Config['openai']>;
  language?: string;
  commitStyle?: Config['commitStyle'];
  autoCommit?: boolean;
  splitCommits?: boolean;
  dryRun?: boolean;
  smartSplit?: Partial<Config['smartSplit']>;
  cache?: Partial<Config['cache']>;
}

export function loadConfig(configPath?: string): Config {
  // Usar um caminho mais seguro para ambientes CI
  let defaultConfigPath: string;
  try {
    defaultConfigPath = join(process.cwd(), '.commit-wizardrc');
  } catch {
    // Fallback para ambientes onde process.cwd() falha
    defaultConfigPath = '/tmp/.commit-wizardrc';
  }

  const globalConfigPath = join(
    process.env.HOME || process.env.USERPROFILE || '/tmp',
    '.commit-wizardrc'
  );

  let config = { ...DEFAULT_CONFIG };

  // Carregar configuração global primeiro
  try {
    if (existsSync(globalConfigPath)) {
      const fileContent = readFileSync(globalConfigPath, 'utf-8');
      const globalConfig = JSON.parse(fileContent);
      config = mergeConfig(config, globalConfig);
    }
  } catch {
    console.warn(`⚠️  Erro ao ler configuração global: Erro desconhecido`);
  }

  // Carregar configuração local (sobrescreve a global)
  const actualConfigPath = configPath || defaultConfigPath;
  try {
    if (existsSync(actualConfigPath)) {
      const fileContent = readFileSync(actualConfigPath, 'utf-8');
      const userConfig = JSON.parse(fileContent);
      config = mergeConfig(config, userConfig);
    }
  } catch {
    console.warn(`⚠️  Erro ao ler .commit-wizardrc: Erro desconhecido`);
  }

  // Adicionar chave da OpenAI das variáveis de ambiente
  config.openai.apiKey = process.env.OPENAI_API_KEY;

  // Aplicar configurações de ambiente
  if (process.env.COMMIT_WIZARD_DEBUG === 'true') {
    // config.advanced.enableDebug = true; // Removed advanced options
    // config.advanced.logLevel = 'debug'; // Removed advanced options
  }

  if (process.env.COMMIT_WIZARD_DRY_RUN === 'true') {
    config.dryRun = true;
  }

  return config;
}

function mergeConfig(defaultConfig: Config, userConfig: UserConfig): Config {
  return {
    ...defaultConfig,
    ...userConfig,
    openai: {
      ...defaultConfig.openai,
      ...userConfig.openai,
    },
    smartSplit: {
      ...defaultConfig.smartSplit,
      ...userConfig.smartSplit,
    },
    cache: {
      ...defaultConfig.cache,
      ...userConfig.cache,
    },
  };
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = [];

  // Validação básica
  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY não encontrada nas variáveis de ambiente');
  }

  if (config.openai.maxTokens < 10 || config.openai.maxTokens > 4000) {
    errors.push('maxTokens deve estar entre 10 e 4000');
  }

  if (config.openai.temperature < 0 || config.openai.temperature > 2) {
    errors.push('temperature deve estar entre 0 e 2');
  }

  if (
    !['pt', 'en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh'].includes(
      config.language
    )
  ) {
    errors.push(
      'language deve ser um idioma suportado (pt, en, es, fr, de, it, ja, ko, zh)'
    );
  }

  if (!['conventional', 'simple', 'detailed'].includes(config.commitStyle)) {
    errors.push('commitStyle deve ser conventional, simple ou detailed');
  }

  // Validação Smart Split
  if (config.smartSplit.minGroupSize < 1) {
    errors.push('smartSplit.minGroupSize deve ser pelo menos 1');
  }

  if (config.smartSplit.maxGroups < 1 || config.smartSplit.maxGroups > 10) {
    errors.push('smartSplit.maxGroups deve estar entre 1 e 10');
  }

  if (
    config.smartSplit.confidenceThreshold < 0 ||
    config.smartSplit.confidenceThreshold > 1
  ) {
    errors.push('smartSplit.confidenceThreshold deve estar entre 0 e 1');
  }

  // Validação Cache
  if (config.cache.ttl < 1) {
    errors.push('cache.ttl deve ser pelo menos 1 minuto');
  }

  if (config.cache.maxSize < 1) {
    errors.push('cache.maxSize deve ser pelo menos 1');
  }

  return errors;
}

/**
 * Cria um arquivo de configuração exemplo
 */
export function createExampleConfig(path: string = '.commit-wizardrc'): void {
  const exampleConfig = {
    language: 'pt',
    commitStyle: 'conventional',
    autoCommit: false,
    splitCommits: true,
    openai: {
      model: 'gpt-4o',
      maxTokens: 200,
      temperature: 0.7,
      timeout: 30000,
      retries: 2,
    },
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

  fs.writeFileSync(path, JSON.stringify(exampleConfig, null, 2));
}
