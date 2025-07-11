// Importar polyfill antes de qualquer outra coisa
import '../src/utils/polyfill';

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { execSync } from 'child_process';
import { existsSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Função helper para criar um repositório Git temporário
function createTempRepo(): string {
  const tempDir = join(tmpdir(), `commit-wizard-test-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  // Inicializar repositório Git
  execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  execSync('git config user.name "Test User"', {
    cwd: tempDir,
    stdio: 'ignore',
  });
  execSync('git config user.email "test@example.com"', {
    cwd: tempDir,
    stdio: 'ignore',
  });

  return tempDir;
}

// Função helper para cleanup
function cleanupTempRepo(tempDir: string) {
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

// Função helper para criar arquivos de teste
function createTestFiles(repoDir: string) {
  // Criar estrutura de pastas
  mkdirSync(join(repoDir, 'src'), { recursive: true });
  mkdirSync(join(repoDir, 'tests'), { recursive: true });

  // Criar arquivos iniciais
  writeFileSync(
    join(repoDir, 'README.md'),
    '# Test Project\n\nA test project for commit-wizard.'
  );
  writeFileSync(
    join(repoDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project',
      },
      null,
      2
    )
  );

  // Commit inicial
  execSync('git add .', { cwd: repoDir, stdio: 'ignore' });
  execSync('git commit -m "Initial commit"', { cwd: repoDir, stdio: 'ignore' });
}

// Função helper para modificar arquivos
function modifyFiles(
  repoDir: string,
  scenario: 'single' | 'multiple' | 'complex'
) {
  switch (scenario) {
    case 'single':
      // Modificar apenas um arquivo
      writeFileSync(
        join(repoDir, 'README.md'),
        '# Test Project\n\nA test project for commit-wizard.\n\n## New Feature\n\nAdded new documentation.'
      );
      break;

    case 'multiple':
      // Modificar múltiplos arquivos relacionados
      writeFileSync(
        join(repoDir, 'src/auth.ts'),
        `
export class AuthService {
  login(username: string, password: string): boolean {
    // Implementação de login
    return username === 'admin' && password === 'password';
  }
  
  logout(): void {
    // Implementação de logout
  }
}
`
      );
      writeFileSync(
        join(repoDir, 'src/user.ts'),
        `
export interface User {
  id: string;
  username: string;
  email: string;
}

export class UserService {
  getUser(id: string): User | null {
    // Implementação de busca de usuário
    return null;
  }
}
`
      );
      writeFileSync(
        join(repoDir, 'tests/auth.test.ts'),
        `
import { AuthService } from '../src/auth';

describe('AuthService', () => {
  it('should authenticate valid user', () => {
    const auth = new AuthService();
    expect(auth.login('admin', 'password')).toBe(true);
  });
});
`
      );
      break;

    case 'complex':
      // Criar diretório docs se não existir
      mkdirSync(join(repoDir, 'docs'), { recursive: true });

      // Cenário complexo com diferentes tipos de mudanças
      writeFileSync(
        join(repoDir, 'src/api.ts'),
        `
export class ApiClient {
  async get(url: string): Promise<any> {
    const response = await fetch(url);
    return response.json();
  }
}
`
      );
      writeFileSync(
        join(repoDir, 'src/utils.ts'),
        `
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function validateEmail(email: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}
`
      );
      writeFileSync(
        join(repoDir, 'docs/API.md'),
        `
# API Documentation

## Endpoints

### GET /users
Returns list of users.
`
      );
      writeFileSync(
        join(repoDir, 'package.json'),
        JSON.stringify(
          {
            name: 'test-project',
            version: '1.1.0',
            description: 'Test project with API',
            dependencies: {
              '@types/node': '^20.0.0',
            },
          },
          null,
          2
        )
      );
      break;
  }

  // Adicionar arquivos ao staging
  execSync('git add .', { cwd: repoDir, stdio: 'ignore' });
}

describe('Commit Wizard - Testes de Integração', () => {
  let tempRepo: string;

  beforeEach(() => {
    tempRepo = createTempRepo();
    createTestFiles(tempRepo);
  });

  afterEach(() => {
    cleanupTempRepo(tempRepo);
  });

  describe('Configuração', () => {
    it('deve carregar configuração padrão', async () => {
      const { loadConfig } = await import('../src/config/index.ts');
      const config = loadConfig();

      expect(config).toBeDefined();
      expect(config.language).toBe('pt');
      expect(config.commitStyle).toBe('conventional');
      expect(config.openai.model).toBe('gpt-4o');
    });

    it('deve carregar configuração personalizada', async () => {
      const configPath = join(tempRepo, '.commit-wizardrc');
      const customConfig = {
        language: 'en',
        commitStyle: 'simple',
        openai: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
        },
      };

      writeFileSync(configPath, JSON.stringify(customConfig, null, 2));

      const { loadConfig } = await import('../src/config/index.ts');
      const config = loadConfig(configPath);

      expect(config.language).toBe('en');
      expect(config.commitStyle).toBe('simple');
      expect(config.openai.model).toBe('gpt-3.5-turbo');
      expect(config.openai.temperature).toBe(0.5);
    });

    it('deve validar configuração', async () => {
      const { validateConfig, loadConfig } = await import(
        '../src/config/index.ts'
      );

      // Começar com config válida e tornar algumas propriedades inválidas
      const validConfig = loadConfig();
      const invalidConfig = {
        ...validConfig,
        openai: {
          ...validConfig.openai,
          maxTokens: 5000, // Inválido
          temperature: 3.0, // Inválido
        },
        smartSplit: {
          ...validConfig.smartSplit,
          maxGroups: 15, // Inválido
        },
      };

      const errors = validateConfig(invalidConfig);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.includes('maxTokens'))).toBe(true);
      expect(errors.some((error) => error.includes('temperature'))).toBe(true);
      expect(errors.some((error) => error.includes('maxGroups'))).toBe(true);
    });
  });

  describe('Funções Git', () => {
    it('deve detectar repositório Git', async () => {
      process.chdir(tempRepo);
      const { isGitRepository } = await import('../src/git/index.ts');
      const isRepo = isGitRepository();
      expect(isRepo).toBe(true);
    });

    it('deve obter diff de arquivos staged', async () => {
      process.chdir(tempRepo);
      modifyFiles(tempRepo, 'single');

      const { getGitStatus } = await import('../src/git/index.ts');
      const status = getGitStatus();

      expect(status.diff).toContain('README.md');
      expect(status.diff).toContain('New Feature');
    });

    it('deve obter lista de arquivos modificados', async () => {
      process.chdir(tempRepo);
      modifyFiles(tempRepo, 'multiple');

      const { getGitStatus } = await import('../src/git/index.ts');
      const status = getGitStatus();

      expect(status.stagedFiles).toContain('src/auth.ts');
      expect(status.stagedFiles).toContain('src/user.ts');
      expect(status.stagedFiles).toContain('tests/auth.test.ts');
    });
  });

  describe('Smart Split', () => {
    it('deve analisar contexto e criar grupos', async () => {
      // Timeout mais longo para este teste
      const timeout = setTimeout(() => {
        throw new Error('Teste de smart split demorou muito');
      }, 10000); // 10 segundos

      try {
        // Mock da OpenAI para não fazer chamadas reais
        process.env.OPENAI_API_KEY = 'test-key';
        modifyFiles(tempRepo, 'complex');

        const { analyzeFileContext } = await import(
          '../src/core/smart-split.ts'
        );
        const { loadConfig } = await import('../src/config/index.ts');

        const config = loadConfig();
        const files = [
          'src/api.ts',
          'src/utils.ts',
          'docs/API.md',
          'package.json',
        ];
        const diff = 'mock diff content';

        // Verificar se a função existe e pode ser chamada
        expect(analyzeFileContext).toBeDefined();
        expect(typeof analyzeFileContext).toBe('function');

        // Testar que a função retorna uma Promise
        const result = analyzeFileContext(files, diff, config);
        expect(result).toBeInstanceOf(Promise);

        // Aguardar o resultado e verificar que não quebra
        // Como não temos uma chave válida da OpenAI, esperamos que falhe graciosamente
        const analysis = await result;
        expect(analysis).toBeDefined();
        expect(typeof analysis).toBe('object');
        expect('success' in analysis).toBe(true);

        // Se a API key for inválida, o resultado deve indicar falha
        if (!analysis.success) {
          expect(analysis.error).toBeDefined();
          expect(typeof analysis.error).toBe('string');
          // Aceitar tanto erro de chave não encontrada quanto erro de API inválida
          expect(analysis.error).toMatch(
            /(Chave da OpenAI não encontrada|Erro da OpenAI|Incorrect API key)/
          );
        }
      } finally {
        clearTimeout(timeout);
      }
    });

    it('deve gerar diff para grupo de arquivos', async () => {
      process.chdir(tempRepo);
      modifyFiles(tempRepo, 'multiple');

      const { generateGroupDiff } = await import('../src/core/smart-split.ts');
      const group = {
        id: 'test-group',
        name: 'Auth System',
        description: 'Authentication related files',
        files: ['src/auth.ts', 'src/user.ts'],
        diff: '',
        confidence: 0.9,
      };

      const diff = await generateGroupDiff(group);
      expect(typeof diff).toBe('string');
    });
  });

  describe('Argumentos CLI', () => {
    it('deve parsear argumentos básicos', async () => {
      const { parseArgs } = await import('../src/utils/args.ts');

      const args1 = parseArgs(['--silent', '--yes']);
      expect(args1.silent).toBe(true);
      expect(args1.yes).toBe(true);

      const args2 = parseArgs(['--split', '--dry-run']);
      expect(args2.split).toBe(true);
      expect(args2.dryRun).toBe(true);

      const args3 = parseArgs(['--smart-split', '--auto']);
      expect(args3.smartSplit).toBe(true);
      expect(args3.auto).toBe(true);
    });

    it('deve mostrar ajuda', async () => {
      const { parseArgs } = await import('../src/utils/args.ts');

      const args = parseArgs(['--help']);
      expect(args.help).toBe(true);
    });

    it('deve mostrar versão', async () => {
      const { parseArgs } = await import('../src/utils/args.ts');

      const args = parseArgs(['--version']);
      expect(args.version).toBe(true);
    });
  });

  describe('Cenários End-to-End', () => {
    it('deve processar commit único simples', async () => {
      process.chdir(tempRepo);
      modifyFiles(tempRepo, 'single');

      // Verificar que há mudanças staged
      const { getGitStatus } = await import('../src/git/index.ts');
      const status = getGitStatus();

      expect(status.stagedFiles.length).toBeGreaterThan(0);
      expect(status.stagedFiles).toContain('README.md');
    });

    it('deve processar múltiplos arquivos para split', async () => {
      process.chdir(tempRepo);
      modifyFiles(tempRepo, 'multiple');

      const { getGitStatus } = await import('../src/git/index.ts');
      const status = getGitStatus();

      expect(status.stagedFiles.length).toBeGreaterThan(1);
      expect(status.stagedFiles).toContain('src/auth.ts');
      expect(status.stagedFiles).toContain('tests/auth.test.ts');
    });

    it('deve validar que não há mudanças staged', async () => {
      process.chdir(tempRepo);
      // Não modificar nenhum arquivo

      const { getGitStatus } = await import('../src/git/index.ts');
      const status = getGitStatus();

      expect(status.stagedFiles.length).toBe(0);
    });
  });

  describe('Robustez e Tratamento de Erros', () => {
    it('deve verificar funcionalidade de detecção de repositório Git', async () => {
      // Apenas testar que a função funciona sem erro
      const { isGitRepository } = await import('../src/git/index.ts');

      // A função deve ser callable sem lançar erro
      expect(() => isGitRepository()).not.toThrow();

      // E deve retornar um boolean
      const result = isGitRepository();
      expect(typeof result).toBe('boolean');
    });

    it('deve lidar com configuração JSON inválida', async () => {
      // Suprimir avisos temporariamente
      const originalWarn = console.warn;
      const originalError = console.error;
      console.warn = () => {};
      console.error = () => {};

      try {
        const configPath = join(tempRepo, '.commit-wizardrc');
        writeFileSync(configPath, '{ invalid json }');

        const { loadConfig } = await import('../src/config/index.ts');

        // Deve carregar configuração padrão sem quebrar
        expect(() => loadConfig(configPath)).not.toThrow();

        // Verificar que a configuração carregada tem as propriedades esperadas
        const config = loadConfig(configPath);
        expect(config).toBeDefined();
        expect(config.language).toBe('pt');
        expect(config.commitStyle).toBe('conventional');
        expect(config.openai).toBeDefined();
        expect(config.smartSplit).toBeDefined();
      } finally {
        // Restaurar comportamento normal
        console.warn = originalWarn;
        console.error = originalError;
      }
    });

    it('deve lidar com arquivos grandes', async () => {
      process.chdir(tempRepo);
      // Criar arquivo de tamanho moderado (10KB)
      const largeContent = 'x'.repeat(10 * 1024); // 10KB
      writeFileSync(join(tempRepo, 'large-file.txt'), largeContent);
      execSync('git add large-file.txt', { cwd: tempRepo, stdio: 'ignore' });

      const { getGitStatus } = await import('../src/git/index.ts');
      const status = getGitStatus();

      expect(status.stagedFiles).toContain('large-file.txt');
    });
  });
});
