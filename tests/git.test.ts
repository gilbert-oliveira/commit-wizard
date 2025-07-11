// Importar polyfill antes de qualquer outra coisa
import '../src/utils/polyfill';

import { describe, it, expect } from 'bun:test';

describe('Git Functions - Escape de Caracteres Especiais', () => {
  describe('Função escapeShellArg', () => {
    // Simular a função de escape do arquivo git/index.ts
    function escapeShellArg(arg: string): string {
      return `'${arg.replace(/'/g, "'\"'\"'")}'`;
    }

    it('deve escapar aspas simples corretamente', () => {
      const message = "feat: adicionar validação no método 'EntregaService'";
      const escaped = escapeShellArg(message);
      const expected = `'feat: adicionar validação no método '"'"'EntregaService'"'"''`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com aspas duplas sem escape especial', () => {
      const message = 'feat: adicionar função "isPermitido" para validação';
      const escaped = escapeShellArg(message);
      const expected = `'feat: adicionar função "isPermitido" para validação'`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com caracteres especiais do shell (backticks, cifrão, backslash)', () => {
      const message =
        'feat: adicionar comando `git status` e variável $PATH com escape \\';
      const escaped = escapeShellArg(message);
      const expected = `'feat: adicionar comando \`git status\` e variável $PATH com escape \\'`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com quebras de linha', () => {
      const message = 'feat: adicionar função\ncom quebra de linha';
      const escaped = escapeShellArg(message);
      const expected = `'feat: adicionar função\ncom quebra de linha'`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com caracteres Unicode', () => {
      const message =
        'feat: adicionar suporte à acentuação (ção, ã, é, í, ó, ú)';
      const escaped = escapeShellArg(message);
      const expected = `'feat: adicionar suporte à acentuação (ção, ã, é, í, ó, ú)'`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com emojis', () => {
      const message = 'feat: ✨ adicionar nova funcionalidade 🚀';
      const escaped = escapeShellArg(message);
      const expected = `'feat: ✨ adicionar nova funcionalidade 🚀'`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com parênteses e colchetes', () => {
      const message = 'feat(auth): adicionar validação [importante] (urgente)';
      const escaped = escapeShellArg(message);
      const expected = `'feat(auth): adicionar validação [importante] (urgente)'`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com mensagem vazia', () => {
      const message = '';
      const escaped = escapeShellArg(message);
      const expected = `''`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com apenas espaços', () => {
      const message = '   ';
      const escaped = escapeShellArg(message);
      const expected = `'   '`;

      expect(escaped).toBe(expected);
    });

    it('deve lidar com múltiplas aspas simples consecutivas', () => {
      const message = "feat: adicionar parsing de '''valor vazio'''";
      const escaped = escapeShellArg(message);
      const expected = `'feat: adicionar parsing de '"'"''"'"''"'"'valor vazio'"'"''"'"''"'"''`;

      expect(escaped).toBe(expected);
    });
  });

  describe('Construção de comandos git commit com nova abordagem', () => {
    function escapeShellArg(arg: string): string {
      return `'${arg.replace(/'/g, "'\"'\"'")}'`;
    }

    it('deve construir comando git commit seguro com aspas duplas', () => {
      const message = 'feat: adicionar função "isValid" no service';
      const escapedMessage = escapeShellArg(message);
      const expectedCommand = `git commit -m 'feat: adicionar função "isValid" no service'`;

      const actualCommand = `git commit -m ${escapedMessage}`;
      expect(actualCommand).toBe(expectedCommand);
    });

    it('deve construir comando git commit seguro com aspas simples', () => {
      const message = "feat: adicionar validação no método 'EntregaService'";
      const escapedMessage = escapeShellArg(message);
      const expectedCommand = `git commit -m 'feat: adicionar validação no método '"'"'EntregaService'"'"''`;

      const actualCommand = `git commit -m ${escapedMessage}`;
      expect(actualCommand).toBe(expectedCommand);
    });

    it('deve construir comando git commit seguro com caracteres especiais', () => {
      const message = 'feat: adicionar comando `git status` e variável $PATH';
      const escapedMessage = escapeShellArg(message);
      const expectedCommand = `git commit -m 'feat: adicionar comando \`git status\` e variável $PATH'`;

      const actualCommand = `git commit -m ${escapedMessage}`;
      expect(actualCommand).toBe(expectedCommand);
    });

    it('deve construir comando git commit para arquivo específico', () => {
      const filename = 'src/test file.ts';
      const message = 'feat: adicionar função "test" com caracteres $especiais';
      const escapedFilename = escapeShellArg(filename);
      const escapedMessage = escapeShellArg(message);
      const expectedCommand = `git commit 'src/test file.ts' -m 'feat: adicionar função "test" com caracteres $especiais'`;

      const actualCommand = `git commit ${escapedFilename} -m ${escapedMessage}`;
      expect(actualCommand).toBe(expectedCommand);
    });

    it('deve ser mais seguro que a abordagem anterior com aspas duplas', () => {
      const problematicMessage =
        'feat: adicionar função com `backticks` e $variavel e "aspas"';

      // Abordagem antiga (problemática)
      const oldEscape = `"${problematicMessage.replace(/"/g, '\\"')}"`;

      // Nova abordagem (segura)
      const newEscape = escapeShellArg(problematicMessage);

      // A nova abordagem deve encapsular tudo em aspas simples
      expect(newEscape).toBe(
        `'feat: adicionar função com \`backticks\` e $variavel e "aspas"'`
      );

      // A abordagem antiga teria problemas com backticks e variáveis
      const expectedOld =
        '"feat: adicionar função com `backticks` e $variavel e ' +
        String.fromCharCode(92) +
        String.fromCharCode(34) + 'aspas' +
        String.fromCharCode(92) +
        String.fromCharCode(34) +
        '"';
      expect(oldEscape).toBe(expectedOld);
    });
  });

  describe('Casos de teste específicos do bug reportado', () => {
    function escapeShellArg(arg: string): string {
      return `'${arg.replace(/'/g, "'\"'\"'")}'`;
    }

    it('deve lidar com mensagens que causavam divergência entre terminal e commit', () => {
      const testCases = [
        'feat: adicionar função "ValidarTratamentoEntregaService"',
        'fix: corrigir método `getUser` com validação $userId',
        "refactor: melhorar 'performance' do sistema",
        'feat: implementar autenticação com token JWT e validação \\escape',
        'docs: atualizar README.md com seção de "Instalação"',
      ];

      testCases.forEach((message) => {
        const escaped = escapeShellArg(message);

        // Verificar que não há caracteres problemáticos expostos
        expect(escaped.startsWith("'")).toBe(true);
        expect(escaped.endsWith("'")).toBe(true);

        // Verificar que o comando seria válido e seguro
        const command = `git commit -m ${escaped}`;
        expect(command).toContain("git commit -m '");
        expect(escaped.startsWith("'")).toBe(true);
        expect(escaped.endsWith("'")).toBe(true);
        // Com aspas simples, backticks e variáveis são seguros pois não são interpretados pelo shell
      });
    });

    it('deve preservar a mensagem original quando executada', () => {
      const originalMessage =
        'feat: adicionar função "isValid" com suporte à $variavel e `comando`';
      const escaped = escapeShellArg(originalMessage);

      // Simular o que o shell faria: extrair o conteúdo entre aspas simples
      const extractedMessage = escaped.slice(1, -1).replace(/'"'"'/g, "'");

      expect(extractedMessage).toBe(originalMessage);
    });
  });
});
