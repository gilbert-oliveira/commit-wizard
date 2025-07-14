export interface CLIArgs {
  silent: boolean;
  yes: boolean;
  auto: boolean;
  split: boolean;
  smartSplit: boolean;
  dryRun: boolean;
  help: boolean;
  version: boolean;
}

export function parseArgs(args: string[]): CLIArgs {
  return {
    silent: args.includes('--silent') || args.includes('-s'),
    yes: args.includes('--yes') || args.includes('-y'),
    auto: args.includes('--auto') || args.includes('-a'),
    split: args.includes('--split'),
    smartSplit: args.includes('--smart-split'),
    dryRun: args.includes('--dry-run') || args.includes('-n'),
    help: args.includes('--help') || args.includes('-h'),
    version: args.includes('--version') || args.includes('-v'),
  };
}

export function showHelp(): void {
  console.log(`
🧙‍♂️ Commit Wizard - Gerador inteligente de mensagens de commit

USAGE:
  commit-wizard [OPTIONS]

OPTIONS:
  -s, --silent         Modo silencioso (sem logs detalhados)
  -y, --yes            Confirmar automaticamente sem prompts
  -a, --auto           Modo automático (--yes + --silent)
  --split              Modo split manual (commits separados por arquivo)
  --smart-split        Modo smart split (IA agrupa por contexto)
  -n, --dry-run        Visualizar mensagem sem fazer commit
  -h, --help           Mostrar esta ajuda
  -v, --version        Mostrar versão

EXAMPLES:
  commit-wizard                    # Modo interativo padrão
  commit-wizard --yes              # Commit automático
  commit-wizard --split            # Split manual por arquivo
  commit-wizard --smart-split      # Smart split com IA
  commit-wizard --dry-run          # Apenas visualizar mensagem
  commit-wizard --auto             # Modo totalmente automático

Para mais informações, visite: https://github.com/user/commit-wizard
`);
}

export function showVersion(): void {
  console.log('commit-wizard v2.9.4');
}
