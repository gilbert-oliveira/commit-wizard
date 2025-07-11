/**
 * Polyfill para stripVTControlCharacters para compatibilidade com Bun/Node.js
 *
 * Este polyfill resolve problemas de compatibilidade onde o Bun não mapeia
 * corretamente a função stripVTControlCharacters do módulo util do Node.js.
 * A função foi adicionada ao Node.js v16.14.0+ mas pode não estar disponível
 * em todos os ambientes ou ter problemas de mapping no Bun.
 */

/**
 * Remove caracteres de controle VT de uma string
 * Implementação baseada na função nativa do Node.js
 *
 * @param str - String da qual remover os caracteres de controle
 * @returns String limpa sem caracteres de controle VT/ANSI
 */
function stripVTControlCharacters(str: string): string {
  if (typeof str !== 'string') {
    throw new TypeError('The "str" argument must be of type string');
  }

  // Regex para caracteres de controle ANSI/VT
  // Baseada na implementação oficial do Node.js
  const esc = String.fromCharCode(27); // ESC character (\u001B)
  const csi = String.fromCharCode(155); // CSI character (\u009B)
  const ansiRegex = new RegExp(
    `[${esc}${csi}][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]`,
    'g'
  );

  return str.replace(ansiRegex, '');
}

// Interceptar require/import do módulo util antes de qualquer outra coisa

const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id: string) {
  const result = originalRequire.apply(this, arguments);

  // Se estiver importando o módulo util e stripVTControlCharacters não existe, adicionar
  if (id === 'util' && result && !result.stripVTControlCharacters) {
    result.stripVTControlCharacters = stripVTControlCharacters;
    // Tornar a propriedade não enumerável para não interferir em iterações
    Object.defineProperty(result, 'stripVTControlCharacters', {
      value: stripVTControlCharacters,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }

  return result;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      stripVTControlCharacters?: typeof stripVTControlCharacters;
    }
  }
}

// Disponibilizar globalmente também como fallback
 
if (
  typeof globalThis !== 'undefined' &&
  !(globalThis as any).stripVTControlCharacters
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).stripVTControlCharacters = stripVTControlCharacters;
}

// Tentar aplicar diretamente ao módulo util se possível
try {
  const util = require('util');
  if (!util.stripVTControlCharacters) {
    util.stripVTControlCharacters = stripVTControlCharacters;
  }
} catch {
  // Ignorar se não conseguir aplicar
}

export { stripVTControlCharacters };
