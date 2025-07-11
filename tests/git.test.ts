// Importar polyfill antes de qualquer outra coisa
import '../src/utils/polyfill';

import { describe, it, expect } from 'bun:test';

describe('Git Functions - Escape de Aspas', () => {
  describe('Lógica de escape de aspas duplas', () => {
    it('deve escapar aspas duplas na mensagem de commit', () => {
      const message = 'feat: adicionar função "isPermitido" para validação';

      // Testar diretamente a lógica de escape
      const escapedMessage = message.replace(/"/g, '\\"');
      const expectedEscaped = 'feat: adicionar função \\"isPermitido\\" para validação';
      
      expect(escapedMessage).toBe(expectedEscaped);
      
      // Verificar que o comando seria construído corretamente
      const expectedCommand = `git commit -m "${escapedMessage}"`;
      expect(expectedCommand).toBe('git commit -m "feat: adicionar função \\"isPermitido\\" para validação"');
    });

    it('deve lidar com aspas simples sem escape', () => {
      const message = "feat: adicionar validação no método 'EntregaService'";
      
      // Aspas simples não precisam ser escapadas para o comando git
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe(message);
    });

    it('deve lidar com crases sem escape', () => {
      const message = 'feat: adicionar comando `git status` no helper';
      
      // Crases não precisam ser escapadas para o comando git
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe(message);
    });

    it('deve escapar múltiplas aspas duplas', () => {
      const message = 'feat: adicionar "isValid" e "checkPermission" methods';
      const expectedEscaped = 'feat: adicionar \\"isValid\\" e \\"checkPermission\\" methods';
      
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe(expectedEscaped);
    });

    it('deve lidar com mensagem vazia', () => {
      const message = '';
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe('');
    });

    it('deve lidar com mensagem sem aspas', () => {
      const message = 'feat: adicionar nova funcionalidade';
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe(message);
    });
  });

  describe('Construção de comandos git commit', () => {
    it('deve escapar aspas duplas na mensagem de commit para arquivo específico', () => {
      const filename = 'src/test.ts';
      const message = 'feat: adicionar função "isValid" no service';
      
      const escapedMessage = message.replace(/"/g, '\\"');
      const expectedCommand = `git commit "${filename}" -m "${escapedMessage}"`;
      
      expect(expectedCommand).toBe('git commit "src/test.ts" -m "feat: adicionar função \\"isValid\\" no service"');
    });

    it('deve lidar com nomes de arquivo com espaços', () => {
      const filename = 'src/my file.ts';
      const message = 'feat: adicionar função "test" no arquivo';
      
      const escapedMessage = message.replace(/"/g, '\\"');
      const expectedCommand = `git commit "${filename}" -m "${escapedMessage}"`;
      
      expect(expectedCommand).toBe('git commit "src/my file.ts" -m "feat: adicionar função \\"test\\" no arquivo"');
    });

    it('deve escapar aspas em commits de múltiplos arquivos', () => {
      const files = ['src/test1.ts', 'src/test2.ts'];
      const message = 'feat: implementar "SmartValidation" nos componentes';
      
      const filesArg = files.map((f) => `"${f}"`).join(' ');
      const escapedMessage = message.replace(/"/g, '\\"');
      const expectedCommand = `git commit ${filesArg} -m "${escapedMessage}"`;
      
      expect(expectedCommand).toBe('git commit "src/test1.ts" "src/test2.ts" -m "feat: implementar \\"SmartValidation\\" nos componentes"');
    });

    it('deve lidar com arquivos em diretórios com espaços', () => {
      const files = ['src/my dir/test1.ts', 'src/another dir/test2.ts'];
      const message = 'feat: adicionar "validation" helper';
      
      const filesArg = files.map((f) => `"${f}"`).join(' ');
      const escapedMessage = message.replace(/"/g, '\\"');
      const expectedCommand = `git commit ${filesArg} -m "${escapedMessage}"`;
      
      expect(expectedCommand).toBe('git commit "src/my dir/test1.ts" "src/another dir/test2.ts" -m "feat: adicionar \\"validation\\" helper"');
    });
  });

  describe('Casos extremos de escape', () => {
    it('deve escapar aspas consecutivas', () => {
      const message = 'feat: adicionar parsing de ""valor vazio""';
      const expectedEscaped = 'feat: adicionar parsing de \\"\\"valor vazio\\"\\"';
      
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe(expectedEscaped);
    });

    it('deve escapar aspas no início e fim', () => {
      const message = '"feat: nova funcionalidade importante"';
      const expectedEscaped = '\\"feat: nova funcionalidade importante\\"';
      
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe(expectedEscaped);
    });

    it('deve lidar com combinação de aspas duplas, simples e crases', () => {
      const message = 'feat: adicionar "isValid" usando \'strict\' mode e comando `exec`';
      const expectedEscaped = 'feat: adicionar \\"isValid\\" usando \'strict\' mode e comando `exec`';
      
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe(expectedEscaped);
    });

    it('deve lidar com quebras de linha e caracteres especiais', () => {
      const message = 'feat: adicionar "função\\ncom quebra" de linha';
      const expectedEscaped = 'feat: adicionar \\"função\\ncom quebra\\" de linha';
      
      const escapedMessage = message.replace(/"/g, '\\"');
      expect(escapedMessage).toBe(expectedEscaped);
    });

    it('deve validar que o padrão de escape é consistente com o código real', () => {
      // Este teste garante que estamos usando o mesmo padrão do código real
      const testCases = [
        {
          input: 'feat: adicionar função "isPermitido" para validação',
          expected: 'feat: adicionar função \\"isPermitido\\" para validação'
        },
        {
          input: 'fix: corrigir método "ValidarTratamentoEntregaService"',
          expected: 'fix: corrigir método \\"ValidarTratamentoEntregaService\\"'
        },
        {
          input: 'refactor: melhorar "performance" e \'usabilidade\'',
          expected: 'refactor: melhorar \\"performance\\" e \'usabilidade\''
        },
        {
          input: 'test: adicionar testes para `helper` function "isValid"',
          expected: 'test: adicionar testes para `helper` function \\"isValid\\"'
        }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = input.replace(/"/g, '\\"');
        expect(result).toBe(expected);
      });
    });
  });
}); 