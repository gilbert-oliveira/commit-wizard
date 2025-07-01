import fs from 'fs';
import path from 'path';
import os from 'os';

export interface Config {
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  language: 'pt' | 'en';
  autoCommit: boolean;
  excludePatterns: string[];
  includeEmoji: boolean;
}

const DEFAULT_CONFIG: Config = {
  model: 'gpt-4o',
  temperature: 0.2,
  maxTokens: 1000,
  language: 'pt',
  autoCommit: false,
  excludePatterns: ['*.lock*', '*.log', 'node_modules/**'],
  includeEmoji: true,
};

const CONFIG_FILE_NAME = '.commit-wizard.json';

/**
 * Busca o arquivo de configuração no diretório atual ou no home do usuário
 */
function findConfigFile(): string | null {
  // Primeiro verifica no diretório atual
  const localConfig = path.join(process.cwd(), CONFIG_FILE_NAME);
  if (fs.existsSync(localConfig)) {
    return localConfig;
  }

  // Depois verifica no home do usuário
  const globalConfig = path.join(os.homedir(), CONFIG_FILE_NAME);
  if (fs.existsSync(globalConfig)) {
    return globalConfig;
  }

  return null;
}

/**
 * Carrega a configuração mesclando defaults com arquivo de config
 */
export function loadConfig(): Config {
  const configFile = findConfigFile();
  let userConfig: Partial<Config> = {};

  if (configFile) {
    try {
      const configContent = fs.readFileSync(configFile, 'utf8');
      userConfig = JSON.parse(configContent);
    } catch (error) {
      console.warn(`⚠️ Erro ao ler arquivo de configuração ${configFile}:`, error);
    }
  }

  // Mescla configuração padrão com configuração do usuário
  const config: Config = {
    ...DEFAULT_CONFIG,
    ...userConfig,
    apiKey: userConfig.apiKey || process.env.OPENAI_API_KEY,
  };

  return config;
}

/**
 * Salva a configuração no arquivo local ou global
 */
export function saveConfig(config: Partial<Config>, global = false): void {
  const configPath = global
    ? path.join(os.homedir(), CONFIG_FILE_NAME)
    : path.join(process.cwd(), CONFIG_FILE_NAME);

  try {
    const existingConfig = global ? {} : loadConfig();
    const newConfig = { ...existingConfig, ...config };

    // Remove a apiKey do arquivo (deve ficar apenas em variável de ambiente)
    delete newConfig.apiKey;

    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    console.log(`✅ Configuração salva em ${configPath}`);
  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
  }
}

/**
 * Cria um arquivo de configuração exemplo
 */
export function createConfigExample(): void {
  const configPath = path.join(process.cwd(), `${CONFIG_FILE_NAME}.example`);
  const exampleConfig = {
    ...DEFAULT_CONFIG,
    apiKey: 'sk-your-openai-api-key-here',
  };

  fs.writeFileSync(configPath, JSON.stringify(exampleConfig, null, 2));
  console.log(`📄 Arquivo de exemplo criado: ${configPath}`);
}
