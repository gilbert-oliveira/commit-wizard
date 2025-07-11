import { select, confirm, log, note, isCancel } from '@clack/prompts';
import type { FileGroup } from '../core/smart-split.js';

export interface SmartSplitAction {
  action: 'proceed' | 'manual' | 'cancel';
  groups?: FileGroup[];
}

/**
 * Interface para escolher entre smart split e split manual
 */
export async function chooseSplitMode(): Promise<SmartSplitAction> {
  const mode = await select({
    message: 'Como você gostaria de organizar os commits?',
    options: [
      {
        value: 'smart',
        label: '🧠 Smart Split (Recomendado)',
        hint: 'IA analisa contexto e agrupa automaticamente',
      },
      {
        value: 'manual',
        label: '✋ Split Manual',
        hint: 'Você escolhe arquivos manualmente',
      },
      {
        value: 'cancel',
        label: '❌ Cancelar',
        hint: 'Voltar ao modo normal',
      },
    ],
  });

  if (isCancel(mode)) {
    return { action: 'cancel' };
  }

  if (mode === 'manual') {
    return { action: 'manual' };
  }

  if (mode === 'smart') {
    return { action: 'proceed' };
  }

  return { action: 'cancel' };
}

/**
 * Exibe os grupos identificados pela IA
 */
export async function showSmartSplitGroups(
  groups: FileGroup[]
): Promise<SmartSplitAction> {
  // Criar uma versão mais compacta da exibição para evitar quebra de layout
  const groupsDisplay = groups
    .map((group, index) => {
      // Limitar o número de arquivos exibidos para evitar quebra de layout
      const maxFilesToShow = 5;
      const filesToShow = group.files.slice(0, maxFilesToShow);
      const remainingFiles = group.files.length - maxFilesToShow;
      
      const filesDisplay = filesToShow.join(', ');
      const remainingText = remainingFiles > 0 ? ` (+${remainingFiles} mais)` : '';
      
      return `${index + 1}. **${group.name}** (${group.files.length} arquivo(s))\n` +
             `   📄 ${filesDisplay}${remainingText}\n` +
             `   💡 ${group.description}\n` +
             `   🎯 Confiança: ${Math.round(group.confidence * 100)}%`;
    })
    .join('\n\n');

  note(
    `Identificamos ${groups.length} grupo(s) lógico(s) para seus commits:\n\n${groupsDisplay}`,
    '🧠 Análise de Contexto'
  );

  const action = await select({
    message: 'O que você gostaria de fazer?',
    options: [
      {
        value: 'proceed',
        label: '✅ Prosseguir com esta organização',
        hint: 'Usar os grupos como sugeridos pela IA',
      },
      {
        value: 'manual',
        label: '✋ Fazer split manual',
        hint: 'Escolher arquivos manualmente',
      },
      {
        value: 'cancel',
        label: '❌ Cancelar',
        hint: 'Voltar ao modo normal',
      },
    ],
  });

  if (isCancel(action)) {
    return { action: 'cancel' };
  }

  if (action === 'proceed') {
    return { action: 'proceed', groups };
  }

  return { action: action as 'manual' | 'cancel' };
}

/**
 * Interface para confirmar commit de um grupo
 */
export async function confirmGroupCommit(
  group: FileGroup,
  message: string
): Promise<boolean> {
  note(
    `**Grupo:** ${group.name}\n` +
      `**Arquivos:** ${group.files.join(', ')}\n` +
      `**Mensagem:** "${message}"`,
    '🚀 Confirmar Commit do Grupo'
  );

  const confirmed = await confirm({
    message: `Fazer commit para "${group.name}"?`,
  });

  if (isCancel(confirmed)) {
    return false;
  }

  return confirmed;
}

/**
 * Interface para mostrar progresso do smart split
 */
export function showSmartSplitProgress(
  current: number,
  total: number,
  groupName: string
): void {
  const progress = Math.round((current / total) * 100);
  const bar =
    '█'.repeat(Math.floor(progress / 10)) +
    '░'.repeat(10 - Math.floor(progress / 10));

  log.info(`🔄 Progresso: [${bar}] ${progress}% (${current}/${total})`);
  log.info(`📋 Processando: ${groupName}`);
}
