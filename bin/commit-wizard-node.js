#!/usr/bin/env node

import { intro, outro, log } from '@clack/prompts';
import { main } from '../src/core/index.js';
import { parseArgs, showHelp, showVersion } from '../src/utils/args.js';

async function run() {
  try {
    // Processar argumentos da linha de comando
    const args = parseArgs(process.argv.slice(2));

    // Mostrar ajuda se solicitado
    if (args.help) {
      showHelp();
      process.exit(0);
    }

    // Mostrar versão se solicitado
    if (args.version) {
      showVersion();
      process.exit(0);
    }

    // Modo automático = silent + yes
    if (args.auto) {
      args.silent = true;
      args.yes = true;
    }

    // Intro apenas se não for modo silencioso
    if (!args.silent) {
      intro('🧙‍♂️ Commit Wizard');
    }

    await main(args);

    // Outro apenas se não for modo silencioso
    if (!args.silent) {
      outro('Até logo! ✨');
    }
  } catch (error) {
    log.error(
      `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
    process.exit(1);
  }
}

// Verificar se o arquivo está sendo executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
} 