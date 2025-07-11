/**
 * Polyfill para stripVTControlCharacters para compatibilidade com Bun
 * 
 * Este polyfill resolve um problema de compatibilidade onde o Bun não mapeia
 * corretamente a função stripVTControlCharacters do módulo util do Node.js,
 * causando erros em testes que usam bibliotecas de UI como @clack/prompts.
 * 
 * A função stripVTControlCharacters foi adicionada ao Node.js v16.14.0+
 * e está disponível no Node.js 20, mas o Bun pode não ter o mapping completo.
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

  // Regex para caracteres de controle ANSI/VT (usando código hex para evitar problemas de linting)
  const esc = String.fromCharCode(27); // ESC character (\u001B)
  const csi = String.fromCharCode(155); // CSI character (\u009B)
  const ansiRegex = new RegExp(`[${esc}${csi}][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]`, 'g');
  return str.replace(ansiRegex, '');
}

 
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      stripVTControlCharacters?: typeof stripVTControlCharacters;
    }
  }
}

// Tornar disponível globalmente para que o Bun possa encontrar a função
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof globalThis !== 'undefined' && !(globalThis as any).stripVTControlCharacters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).stripVTControlCharacters = stripVTControlCharacters;
}

export { stripVTControlCharacters };
