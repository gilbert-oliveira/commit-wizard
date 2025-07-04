import * as vscode from 'vscode';
import { loadConfig, Config } from './config.js';
import { AIService } from './ai-service.js';
import { GitUtils } from './git-utils.js';
import { DiffProcessorVSCode } from './diff-processor-vscode.js';
import { CommitSplitter } from './commit-splitter.js';

export function activate(context: vscode.ExtensionContext) {
  console.log('🧙‍♂️ Commit Wizard extension is now active!');

  // Registrar comando para gerar commit
  const generateCommitCmd = vscode.commands.registerCommand('commit-wizard.generate', async () => {
    await generateCommit();
  });

  // Registrar comando para multi-commit
  const multiCommitCmd = vscode.commands.registerCommand('commit-wizard.multiCommit', async () => {
    await runMultiCommit();
  });

  // Registrar comando de configuração
  const configCmd = vscode.commands.registerCommand('commit-wizard.config', async () => {
    await openConfiguration();
  });

  context.subscriptions.push(generateCommitCmd, multiCommitCmd, configCmd);
}

export function deactivate() {}

/**
 * Carrega configuração do VS Code
 */
function loadVSCodeConfig(): Config {
  const config = vscode.workspace.getConfiguration('commit-wizard');
  const fallbackConfig = loadConfig();

  return {
    apiKey: config.get('apiKey') || process.env.OPENAI_API_KEY || fallbackConfig.apiKey,
    model: config.get('model') || fallbackConfig.model,
    language: config.get('language') || fallbackConfig.language,
    temperature: config.get('temperature') || fallbackConfig.temperature,
    maxTokens: config.get('maxTokens') || fallbackConfig.maxTokens,
    includeEmoji: config.get('includeEmoji') ?? fallbackConfig.includeEmoji,
    autoCommit: config.get('autoCommit') ?? fallbackConfig.autoCommit,
    excludePatterns: config.get('excludePatterns') || fallbackConfig.excludePatterns,
  };
}

/**
 * Gera commit usando IA
 */
async function generateCommit() {
  const config = loadVSCodeConfig();

  // Validar API Key
  if (!config.apiKey) {
    const action = await vscode.window.showErrorMessage(
      '🚨 OpenAI API Key não configurada!',
      'Configurar',
      'Cancelar'
    );
    if (action === 'Configurar') {
      await openConfiguration();
    }
    return;
  }

  // Validar se está em um repositório Git
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('❌ Nenhum workspace aberto!');
    return;
  }

  const gitUtils = new GitUtils(config.excludePatterns);

  if (!gitUtils.isGitRepository()) {
    vscode.window.showErrorMessage('❌ Este diretório não é um repositório git.');
    return;
  }

  // Verificar se há alterações staged
  const gitStatus = gitUtils.getStagedStatus();
  if (!gitStatus.hasStagedFiles) {
    const action = await vscode.window.showWarningMessage(
      '⚠️ Não há alterações staged para o commit.',
      'Fazer stage de todas as alterações',
      'Cancelar'
    );

    if (action === 'Fazer stage de todas as alterações') {
      try {
        gitUtils.stageAll();
        vscode.window.showInformationMessage('✅ Todas as alterações foram adicionadas ao stage.');
      } catch (error) {
        vscode.window.showErrorMessage(`❌ Erro ao fazer stage: ${error}`);
        return;
      }
    } else {
      return;
    }
  }

  // Mostrar progresso
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: '🧙‍♂️ Gerando commit...',
      cancellable: false,
    },
    async (progress: vscode.Progress<{ message?: string; increment?: number }>) => {
      try {
        progress.report({ increment: 10, message: 'Analisando alterações...' });

        const diffProcessor = new DiffProcessorVSCode(config.excludePatterns);
        const aiService = new AIService(config);

        // Obter diff
        const diff = gitUtils.getStagedDiff();
        if (!diff) {
          vscode.window.showWarningMessage('⚠️ Nenhuma alteração encontrada no stage.');
          return;
        }

        progress.report({ increment: 30, message: 'Processando diff...' });

        // Processar diff
        const processedDiff = diffProcessor.processDiff(diff);
        const stats = processedDiff.stats;

        progress.report({ increment: 50, message: 'Gerando mensagem com IA...' });

        // Gerar mensagem
        const response = await aiService.generateCommitMessage(processedDiff.content);
        const commitMessage = response.content;

        progress.report({ increment: 90, message: 'Finalizando...' });

        // Mostrar resultado
        await showCommitResult(commitMessage, stats, gitUtils);
      } catch (error) {
        vscode.window.showErrorMessage(`❌ Erro ao gerar commit: ${error}`);
      }
    }
  );
}

/**
 * Executa multi-commit inteligente
 */
async function runMultiCommit() {
  const config = loadVSCodeConfig();

  if (!config.apiKey) {
    const action = await vscode.window.showErrorMessage(
      '🚨 OpenAI API Key não configurada!',
      'Configurar',
      'Cancelar'
    );
    if (action === 'Configurar') {
      await openConfiguration();
    }
    return;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    vscode.window.showErrorMessage('❌ Nenhum workspace aberto!');
    return;
  }

  const gitUtils = new GitUtils(config.excludePatterns);

  if (!gitUtils.isGitRepository()) {
    vscode.window.showErrorMessage('❌ Este diretório não é um repositório git.');
    return;
  }

  // Verificar se há alterações staged
  const gitStatus = gitUtils.getStagedStatus();
  if (!gitStatus.hasStagedFiles) {
    const action = await vscode.window.showWarningMessage(
      '⚠️ Não há alterações staged para o commit.',
      'Fazer stage de todas as alterações',
      'Cancelar'
    );

    if (action === 'Fazer stage de todas as alterações') {
      try {
        gitUtils.stageAll();
        vscode.window.showInformationMessage('✅ Todas as alterações foram adicionadas ao stage.');
      } catch (error) {
        vscode.window.showErrorMessage(`❌ Erro ao fazer stage: ${error}`);
        return;
      }
    } else {
      return;
    }
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: '🎯 Executando Multi-Commit...',
      cancellable: false,
    },
    async (progress: vscode.Progress<{ message?: string; increment?: number }>) => {
      try {
        progress.report({ increment: 10, message: 'Analisando alterações...' });

        const commitSplitter = new CommitSplitter(gitUtils, config);
        const aiService = new AIService(config);

        // Analisa e divide o diff
        const splitResult = await commitSplitter.analyzeAndSplit();

        if (splitResult.groups.length <= 1) {
          vscode.window.showInformationMessage(
            '📝 Apenas um contexto detectado. Usando commit normal...'
          );
          return generateCommit();
        }

        progress.report({ increment: 30, message: 'Dividindo commits...' });

        // Mostrar preview dos grupos
        const groupsPreview = splitResult.groups
          .map(
            (group, index) =>
              `${index + 1}. ${group.emoji} ${group.type}: ${group.description} (${group.files.length} arquivos)`
          )
          .join('\n');

        const proceed = await vscode.window.showInformationMessage(
          `🎯 ${splitResult.groups.length} commits propostos:\n\n${groupsPreview}`,
          'Prosseguir',
          'Cancelar'
        );

        if (proceed !== 'Prosseguir') {
          return;
        }

        progress.report({ increment: 50, message: 'Executando commits...' });

        // Executar commits
        let successCount = 0;
        const totalCommits = splitResult.groups.length;

        for (let i = 0; i < splitResult.groups.length; i++) {
          const group = splitResult.groups[i];

          progress.report({
            increment: 40 / totalCommits,
            message: `Commit ${i + 1}/${totalCommits}: ${group.type}`,
          });

          try {
            // Reset stage
            gitUtils.resetStage();

            // Adicionar apenas os arquivos deste grupo
            for (const file of group.files) {
              gitUtils.stageFile(file);
            }

            // Gerar mensagem específica
            const response = await aiService.generateCommitMessage(group.diff);
            let commitMessage = response.content;

            // Adicionar emoji se necessário
            if (config.includeEmoji && !commitMessage.startsWith(group.emoji)) {
              commitMessage = `${group.emoji} ${commitMessage}`;
            }

            // Fazer commit
            gitUtils.commit(commitMessage);
            successCount++;
          } catch (error) {
            vscode.window.showErrorMessage(`❌ Erro no commit ${i + 1}: ${error}`);
            break;
          }
        }

        // Resultado final
        vscode.window.showInformationMessage(
          `🎉 Multi-commit concluído! Commits realizados: ${successCount}/${totalCommits}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`❌ Erro durante multi-commit: ${error}`);
      }
    }
  );
}

/**
 * Mostra resultado do commit gerado
 */
async function showCommitResult(commitMessage: string, stats: any, gitUtils: GitUtils) {
  const action = await vscode.window.showInformationMessage(
    `✨ Commit gerado:\n\n${commitMessage}\n\n📊 Estatísticas:\n• Arquivos: ${stats.filesChanged}\n• Linhas: +${stats.linesAdded} -${stats.linesDeleted}`,
    'Confirmar e Commitar',
    'Editar Mensagem',
    'Regenerar',
    'Cancelar'
  );

  switch (action) {
    case 'Confirmar e Commitar':
      try {
        gitUtils.commit(commitMessage);
        vscode.window.showInformationMessage('✅ Commit realizado com sucesso!');
      } catch (error) {
        vscode.window.showErrorMessage(`❌ Erro ao fazer commit: ${error}`);
      }
      break;

    case 'Editar Mensagem': {
      const editedMessage = await vscode.window.showInputBox({
        value: commitMessage,
        prompt: 'Edite a mensagem do commit:',
        placeHolder: 'Digite a mensagem do commit...',
      });

      if (editedMessage) {
        try {
          gitUtils.commit(editedMessage);
          vscode.window.showInformationMessage('✅ Commit realizado com sucesso!');
        } catch (error) {
          vscode.window.showErrorMessage(`❌ Erro ao fazer commit: ${error}`);
        }
      }
      break;
    }

    case 'Regenerar':
      await generateCommit();
      break;

    case 'Cancelar':
      break;
  }
}

/**
 * Abre configuração do VS Code
 */
async function openConfiguration() {
  await vscode.commands.executeCommand('workbench.action.openSettings', 'commit-wizard');
}
