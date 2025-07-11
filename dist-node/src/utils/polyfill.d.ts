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
declare function stripVTControlCharacters(str: string): string;
declare global {
    namespace NodeJS {
        interface Global {
            stripVTControlCharacters?: typeof stripVTControlCharacters;
        }
    }
}
export { stripVTControlCharacters };
//# sourceMappingURL=polyfill.d.ts.map