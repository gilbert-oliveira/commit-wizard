import {
  text,
  select,
  confirm,
  log,
  note,
  cancel,
  isCancel,
} from '@clack/prompts';
import type { CommitSuggestion } from '../core/openai';

export interface UIAction {
  action: 'commit' | 'edit' | 'copy' | 'cancel';
  message?: string;
}

/**
 * Exibe a mensagem gerada e permite interação do usuário
 */
export async function showCommitPreview(
  suggestion: CommitSuggestion
): Promise<UIAction> {
  // Exibir preview da mensagem
  note(
    `Tipo: ${suggestion.type}\nMensagem: "${suggestion.message}"`,
    '💭 Sugestão de Commit'
  );

  // Opções disponíveis
  const action = await select({
    message: 'O que você gostaria de fazer?',
    options: [
      {
        value: 'commit',
        label: '✅ Fazer commit com esta mensagem',
        hint: 'Executar git commit imediatamente',
      },
      {
        value: 'edit',
        label: '✏️  Editar mensagem',
        hint: 'Modificar a mensagem antes de commitar',
      },
      {
        value: 'copy',
        label: '📋 Copiar para clipboard',
        hint: 'Copiar mensagem e sair sem commitar',
      },
      {
        value: 'cancel',
        label: '❌ Cancelar',
        hint: 'Sair sem fazer nada',
      },
    ],
  });

  if (isCancel(action)) {
    return { action: 'cancel' };
  }

  return { action: action as UIAction['action'] };
}

/**
 * Permite edição da mensagem de commit
 */
export async function editCommitMessage(
  originalMessage: string
): Promise<UIAction> {
  const editedMessage = await text({
    message: 'Edite a mensagem do commit:',
    initialValue: originalMessage,
    placeholder: 'Digite a mensagem do commit...',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return 'A mensagem não pode estar vazia';
      }
      if (value.trim().length > 72) {
        return 'A mensagem está muito longa (máximo 72 caracteres recomendado)';
      }
    },
  });

  if (isCancel(editedMessage)) {
    return { action: 'cancel' };
  }

  const confirmEdit = await confirm({
    message: `Confirma a mensagem editada: "${editedMessage}"?`,
  });

  if (isCancel(confirmEdit) || !confirmEdit) {
    return { action: 'cancel' };
  }

  return {
    action: 'commit',
    message: editedMessage,
  };
}

/**
 * Copia mensagem para clipboard
 */
export async function copyToClipboard(message: string): Promise<boolean> {
  try {
    const clipboardy = await import('clipboardy');
    await clipboardy.default.write(message);
    log.success('✅ Mensagem copiada para a área de transferência!');
    return true;
  } catch (error) {
    log.error(
      `❌ Erro ao copiar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
    return false;
  }
}

/**
 * Confirma execução do commit
 */
export async function confirmCommit(message: string): Promise<boolean> {
  note(`"${message}"`, '🚀 Confirmar Commit');

  const confirmed = await confirm({
    message: 'Executar o commit agora?',
  });

  if (isCancel(confirmed)) {
    return false;
  }

  return confirmed;
}

/**
 * Exibe resultado do commit
 */
export function showCommitResult(
  success: boolean,
  hash?: string,
  error?: string
) {
  if (success && hash) {
    log.success(`✅ Commit realizado com sucesso!`);
    log.info(`🔗 Hash: ${hash.substring(0, 8)}`);
  } else {
    log.error(`❌ Erro ao realizar commit: ${error || 'Erro desconhecido'}`);
  }
}

/**
 * Interface para modo split (múltiplos commits)
 */
export async function selectFilesForCommit(files: string[]): Promise<string[]> {
  log.info('📋 Modo Split: Selecione os arquivos para este commit');

  const selectedFiles: string[] = [];

  for (const file of files) {
    const include = await confirm({
      message: `Incluir "${file}" neste commit?`,
    });

    if (isCancel(include)) {
      break;
    }

    if (include) {
      selectedFiles.push(file);
    }
  }

  return selectedFiles;
}

/**
 * Confirma se usuário quer continuar com mais commits
 */
export async function askContinueCommits(
  remainingFiles: string[]
): Promise<boolean> {
  if (remainingFiles.length === 0) {
    return false;
  }

  log.info(`📄 Arquivos restantes: ${remainingFiles.join(', ')}`);

  const continueCommits = await confirm({
    message: 'Gerar commit para os arquivos restantes?',
  });

  if (isCancel(continueCommits)) {
    return false;
  }

  return continueCommits;
}

/**
 * Exibe mensagem de cancelamento
 */
export function showCancellation() {
  cancel('Operação cancelada pelo usuário');
}
