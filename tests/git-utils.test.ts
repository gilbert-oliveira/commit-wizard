import { GitUtils } from '../src/git-utils';
import { execSync } from 'child_process';

// Mock do execSync
jest.mock('child_process');
const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

// Mock do fs
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

import fs from 'fs';
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('GitUtils', () => {
  let gitUtils: GitUtils;

  beforeEach(() => {
    gitUtils = new GitUtils();
    jest.clearAllMocks();
    // Configurações padrão para os mocks
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('test commit message');
  });

  describe('isGitRepository', () => {
    it('deve retornar true para repositório Git válido', () => {
      mockedExecSync.mockReturnValue('');
      
      const result = gitUtils.isGitRepository();
      
      expect(result).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git rev-parse --is-inside-work-tree',
        { stdio: 'ignore' }
      );
    });

    it('deve retornar false quando não é repositório Git', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });
      
      const result = gitUtils.isGitRepository();
      
      expect(result).toBe(false);
    });
  });

  describe('getStagedStatus', () => {
    it('deve retornar status quando há arquivos staged', () => {
      mockedExecSync
        .mockReturnValueOnce('') // isGitRepository
        .mockReturnValueOnce('file1.ts\nfile2.js\n') // staged files
        .mockReturnValueOnce('diff content'); // diff

      const status = gitUtils.getStagedStatus();
      
      expect(status).toEqual({
        hasStagedFiles: true,
        stagedFiles: ['file1.ts', 'file2.js'],
        diff: 'diff content',
      });
    });

    it('deve retornar status vazio quando não há arquivos staged', () => {
      mockedExecSync
        .mockReturnValueOnce('') // isGitRepository
        .mockReturnValueOnce(''); // no staged files

      const status = gitUtils.getStagedStatus();
      
      expect(status).toEqual({
        hasStagedFiles: false,
        stagedFiles: [],
        diff: '',
      });
    });

    it('deve aplicar padrões de exclusão', () => {
      const gitUtilsWithExcludes = new GitUtils(['*.lock*', '*.log']);
      mockedExecSync
        .mockReturnValueOnce('') // isGitRepository primeiro  
        .mockReturnValueOnce('file1.ts\n') // staged files
        .mockReturnValueOnce('diff content'); // diff

      const status = gitUtilsWithExcludes.getStagedStatus();
      
      expect(status.hasStagedFiles).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith(
        expect.stringContaining('":(exclude)*.lock*" ":(exclude)*.log"'),
        expect.any(Object)
      );
    });

    it('deve lançar erro quando não é repositório Git', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });
      
      expect(() => gitUtils.getStagedStatus()).toThrow(
        'Diretório atual não é um repositório Git'
      );
    });
  });

  describe('commit', () => {
    it('deve fazer commit com mensagem simples', () => {
      mockedExecSync.mockReturnValue(''); // isGitRepository
      
      gitUtils.commit('feat: add new feature');
      
      // Agora usa commitWithFile com mais validações
      expect(mockedFs.existsSync).toHaveBeenCalledWith('/tmp/commit-wizard-message.txt');
      expect(mockedFs.readFileSync).toHaveBeenCalledWith('/tmp/commit-wizard-message.txt', 'utf8');
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git commit -F "/tmp/commit-wizard-message.txt"',
        expect.objectContaining({
          stdio: 'inherit',
          shell: '/bin/bash',
          env: expect.objectContaining({ LC_ALL: 'C' })
        })
      );
    });

    it('deve escapar aspas na mensagem de commit', () => {
      mockedExecSync.mockReturnValue(''); // isGitRepository
      
      gitUtils.commit('fix: resolve "quoted" issue');
      
      // Agora usa commitWithFile com mais validações
      expect(mockedFs.existsSync).toHaveBeenCalledWith('/tmp/commit-wizard-message.txt');
      expect(mockedFs.readFileSync).toHaveBeenCalledWith('/tmp/commit-wizard-message.txt', 'utf8');
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git commit -F "/tmp/commit-wizard-message.txt"',
        expect.objectContaining({
          stdio: 'inherit',
          shell: '/bin/bash',
          env: expect.objectContaining({ LC_ALL: 'C' })
        })
      );
    });

    it('deve incluir argumentos adicionais', () => {
      mockedExecSync.mockReturnValue(''); // isGitRepository
      
      gitUtils.commit('feat: new feature', ['--no-verify', '--author="Test <test@example.com>"']);
      
      // Agora usa commitWithFile com mais validações e argumentos sanitizados
      expect(mockedFs.existsSync).toHaveBeenCalledWith('/tmp/commit-wizard-message.txt');
      expect(mockedFs.readFileSync).toHaveBeenCalledWith('/tmp/commit-wizard-message.txt', 'utf8');
      expect(mockedExecSync).toHaveBeenCalledWith(
        'git commit -F "/tmp/commit-wizard-message.txt" --no-verify --author=\\"Test <test@example.com>\\"',
        expect.objectContaining({
          stdio: 'inherit',
          shell: '/bin/bash',
          env: expect.objectContaining({ LC_ALL: 'C' })
        })
      );
    });

    it('deve lançar erro quando arquivo de mensagem não existe', () => {
      mockedExecSync.mockReturnValue(''); // isGitRepository
      mockedFs.existsSync.mockReturnValue(false);
      
      expect(() => {
        gitUtils.commit('feat: test');
      }).toThrow('Arquivo de mensagem não encontrado');
    });

    it('deve lançar erro quando arquivo de mensagem está vazio', () => {
      mockedExecSync.mockReturnValue(''); // isGitRepository
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('');
      
      expect(() => {
        gitUtils.commit('feat: test');
      }).toThrow('Arquivo de mensagem está vazio');
    });
  });

  describe('getBranches', () => {
    it('deve retornar informações de branches', () => {
      mockedExecSync
        .mockReturnValueOnce('') // isGitRepository
        .mockReturnValueOnce('  main\n* feature/test\n  develop\n');

      const branches = gitUtils.getBranches();
      
      expect(branches).toEqual({
        current: 'feature/test',
        all: ['main', 'feature/test', 'develop'],
      });
    });

    it('deve lidar com branch único', () => {
      mockedExecSync
        .mockReturnValueOnce('') // isGitRepository
        .mockReturnValueOnce('* main\n');

      const branches = gitUtils.getBranches();
      
      expect(branches).toEqual({
        current: 'main',
        all: ['main'],
      });
    });
  });

  describe('hasUncommittedChanges', () => {
    it('deve retornar true quando há mudanças', () => {
      mockedExecSync
        .mockReturnValueOnce('') // isGitRepository
        .mockReturnValueOnce(' M file1.ts\n?? file2.js\n');

      const result = gitUtils.hasUncommittedChanges();
      
      expect(result).toBe(true);
    });

    it('deve retornar false quando não há mudanças', () => {
      mockedExecSync
        .mockReturnValueOnce('') // isGitRepository
        .mockReturnValueOnce('');

      const result = gitUtils.hasUncommittedChanges();
      
      expect(result).toBe(false);
    });

    it('deve retornar false quando não é repositório Git', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });
      
      const result = gitUtils.hasUncommittedChanges();
      
      expect(result).toBe(false);
    });
  });
}); 