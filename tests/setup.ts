// Setup global para testes
process.env.NODE_ENV = 'test';

// Mock para variáveis de ambiente
process.env.OPENAI_API_KEY = 'test-api-key';

// Mock para console para testes mais limpos
const originalConsole = global.console;

beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as any;
});

afterEach(() => {
  global.console = originalConsole;
}); 