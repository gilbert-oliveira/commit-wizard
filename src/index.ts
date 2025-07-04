#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import ora from 'ora';

import { loadConfig, saveConfig, createConfigExample, Config } from './config.js';
import { AIService } from './ai-service.js';
import { GitUtils } from './git-utils.js';
import { DiffProcessor } from './diff-processor.js';
import { CommitSplitter } from './commit-splitter.js';

// 🛑 Tratamento de interrupção (Ctrl+C)
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Processo interrompido pelo usuário. Até mais!'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n\n🛑 Processo terminado. Até mais!'));
  process.exit(0);
});

/**
 * Exibe informações sobre o sistema e configuração
 */
function displaySystemInfo(config: Config, gitUtils: GitUtils): void {
  console.log(chalk.cyan.bold('\n📊 Informações do Sistema:'));
  console.log(chalk.white(`• Modelo AI: ${config.model}`));
  console.log(chalk.white(`• Linguagem: ${config.language}`));
  console.log(chalk.white(`• Temperatura: ${config.temperature}`));
  console.log(chalk.white(`• Tokens máximos: ${config.maxTokens}`));
  console.log(chalk.white(`• Auto commit: ${config.autoCommit ? '✅' : '❌'}`));
  console.log(chalk.white(`• Emojis: ${config.includeEmoji ? '✅' : '❌'}`));

  if (gitUtils.isGitRepository()) {
    const branches = gitUtils.getBranches();
    console.log(chalk.white(`• Branch atual: ${branches.current}`));
    console.log(
      chalk.white(`• Alterações pendentes: ${gitUtils.hasUncommittedChanges() ? '⚠️' : '✅'}`)
    );
  }
}

/**
 * Menu interativo para configuração
 */
async function configurationMenu(): Promise<void> {
  const currentConfig = loadConfig();

  console.log(chalk.blue.bold('\n⚙️ Menu de Configuração'));

  const { action } = await inquirer.prompt<{ action: string }>([
    {
      type: 'list',
      name: 'action',
      message: 'O que você gostaria de configurar?',
      choices: [
        { name: '🤖 Modelo de IA', value: 'model' },
        { name: '🌍 Idioma', value: 'language' },
        { name: '🎛️ Temperatura', value: 'temperature' },
        { name: '📊 Tokens máximos', value: 'maxTokens' },
        { name: '😀 Incluir emojis', value: 'includeEmoji' },
        { name: '🚀 Auto commit', value: 'autoCommit' },
        { name: '🚫 Padrões de exclusão', value: 'excludePatterns' },
        { name: '📄 Criar arquivo exemplo', value: 'createExample' },
        { name: '💾 Salvar configuração global', value: 'saveGlobal' },
        { name: '🔙 Voltar', value: 'back' },
      ],
    },
  ]);

  if (action === 'back') return;
  if (action === 'createExample') {
    createConfigExample();
    return;
  }

  const newConfig: Partial<Config> = {};

  switch (action) {
    case 'model': {
      const { model } = await inquirer.prompt([
        {
          type: 'list',
          name: 'model',
          message: 'Escolha o modelo de IA:',
          choices: [
            { name: 'GPT-4o (Mais recente)', value: 'gpt-4o' },
            { name: 'GPT-4o Mini (Mais rápido e barato)', value: 'gpt-4o-mini' },
            { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
            { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          ],
          default: currentConfig.model,
        },
      ]);
      newConfig.model = model;
      break;
    }

    case 'language': {
      const { language } = await inquirer.prompt([
        {
          type: 'list',
          name: 'language',
          message: 'Escolha o idioma:',
          choices: [
            { name: 'Português', value: 'pt' },
            { name: 'English', value: 'en' },
          ],
          default: currentConfig.language,
        },
      ]);
      newConfig.language = language;
      break;
    }

    case 'temperature': {
      const { temperature } = await inquirer.prompt([
        {
          type: 'input',
          name: 'temperature',
          message: 'Digite a temperatura (0.0 - 1.0):',
          default: currentConfig.temperature.toString(),
          validate: (input: string) => {
            const num = parseFloat(input);
            return !isNaN(num) && num >= 0 && num <= 1 ? true : 'Digite um número entre 0.0 e 1.0';
          },
        },
      ]);
      newConfig.temperature = parseFloat(temperature);
      break;
    }

    case 'maxTokens': {
      const { maxTokens } = await inquirer.prompt([
        {
          type: 'input',
          name: 'maxTokens',
          message: 'Digite o número máximo de tokens:',
          default: currentConfig.maxTokens.toString(),
          validate: (input: string) => {
            const num = parseInt(input);
            return !isNaN(num) && num > 0 ? true : 'Digite um número positivo';
          },
        },
      ]);
      newConfig.maxTokens = parseInt(maxTokens);
      break;
    }

    case 'includeEmoji': {
      const { includeEmoji } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'includeEmoji',
          message: 'Incluir emojis nas mensagens de commit?',
          default: currentConfig.includeEmoji,
        },
      ]);
      newConfig.includeEmoji = includeEmoji;
      break;
    }

    case 'autoCommit': {
      const { autoCommit } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'autoCommit',
          message: 'Fazer commit automaticamente sem confirmação?',
          default: currentConfig.autoCommit,
        },
      ]);
      newConfig.autoCommit = autoCommit;
      break;
    }

    case 'excludePatterns': {
      const { excludePatterns } = await inquirer.prompt([
        {
          type: 'input',
          name: 'excludePatterns',
          message: 'Padrões de exclusão (separados por vírgula):',
          default: currentConfig.excludePatterns.join(', '),
        },
      ]);
      newConfig.excludePatterns = excludePatterns.split(',').map((p: string) => p.trim());
      break;
    }

    case 'saveGlobal':
      saveConfig(currentConfig, true);
      return;
  }

  if (Object.keys(newConfig).length > 0) {
    saveConfig(newConfig);
    console.log(chalk.green('✅ Configuração atualizada com sucesso!'));
  }
}

/**
 * Função principal do commit wizard
 */
async function runCommitWizard(): Promise<void> {
  const config = loadConfig();

  if (!config.apiKey) {
    console.log(
      chalk.redBright('\n🚨 Erro: A variável de ambiente ') +
        chalk.yellow('OPENAI_API_KEY') +
        chalk.redBright(' não está definida.\n')
    );
    console.log(
      chalk.white('→ Defina sua chave com: ') +
        chalk.cyan('export OPENAI_API_KEY="sua-chave"') +
        chalk.white(' ou configure no seu ') +
        chalk.cyan('.bashrc') +
        chalk.white(' ou ') +
        chalk.cyan('.zshrc\n')
    );
    process.exit(1);
  }

  const gitUtils = new GitUtils(config.excludePatterns);
  const aiService = new AIService(config);
  const diffProcessor = new DiffProcessor(aiService, config.maxTokens);

  // Verifica se é um repositório Git
  if (!gitUtils.isGitRepository()) {
    console.error(chalk.red('❌ Este diretório não é um repositório git.'));
    process.exit(1);
  }

  // Obtém status dos arquivos staged
  const gitStatus = gitUtils.getStagedStatus();

  if (!gitStatus.hasStagedFiles) {
    console.log(chalk.yellow('⚠️ Não há alterações staged para o commit.'));
    console.log(
      chalk.cyan('💡 Dica: Use ') +
        chalk.white('git add <arquivos>') +
        chalk.cyan(' para adicionar arquivos ao stage.')
    );
    process.exit(0);
  }

  // Analisa complexidade do diff
  const complexity = diffProcessor.analyzeDiffComplexity(gitStatus.diff);
  const stats = diffProcessor.extractDiffStats(gitStatus.diff);
  const hasBreakingChanges = diffProcessor.detectBreakingChanges(gitStatus.diff);

  console.log(chalk.cyan.bold('\n📈 Análise do Diff:'));
  console.log(chalk.white(`• Arquivos alterados: ${stats.files.length}`));
  console.log(chalk.white(`• Linhas adicionadas: ${chalk.green(`+${stats.additions}`)}`));
  console.log(chalk.white(`• Linhas removidas: ${chalk.red(`-${stats.deletions}`)}`));
  console.log(chalk.white(`• Tokens estimados: ${complexity.tokenCount}`));
  console.log(
    chalk.white(
      `• Complexidade: ${complexity.complexity === 'simple' ? '🟢 Simples' : complexity.complexity === 'moderate' ? '🟡 Moderada' : '🔴 Complexa'}`
    )
  );
  if (hasBreakingChanges) {
    console.log(chalk.yellow('⚠️ Possíveis breaking changes detectadas!'));
  }

  // Processa o diff
  console.log(chalk.cyan('\n🔍 Iniciando análise...'));

  try {
    const processedDiff = await diffProcessor.processLargeDiff(gitStatus.diff);

    // Debug: mostra se há problemas no diff processado
    if (processedDiff.includes('|') && processedDiff.includes('%')) {
      console.log(chalk.yellow('⚠️ Detectado possível conteúdo estranho no diff processado'));
    }

    // Gera mensagem de commit
    const generateSpinner = ora('🤖 Gerando mensagem de commit com IA...').start();
    const response = await aiService.generateCommitMessage(processedDiff);
    generateSpinner.succeed('✨ Mensagem de commit gerada com sucesso.');

    if (response.usage) {
      console.log(
        chalk.dim(
          `\n💰 Tokens utilizados: ${response.usage.totalTokens} (prompt: ${response.usage.promptTokens}, resposta: ${response.usage.completionTokens})`
        )
      );
    }

    // Valida se a mensagem está limpa
    if (response.content.includes('|') && response.content.includes('%')) {
      console.log(chalk.red('🚨 AVISO: Mensagem de commit contém dados estranhos!'));
      console.log(chalk.yellow('Tentando fazer limpeza adicional...'));
    }

    console.log(chalk.greenBright('\n✨ Mensagem de commit gerada:'));
    console.log(chalk.yellowBright(response.content));

    // Se auto commit estiver ativado, faz o commit diretamente
    if (config.autoCommit) {
      console.log(chalk.blue('\n🚀 Auto commit ativado, realizando commit...'));
      gitUtils.commit(response.content);
      console.log(chalk.green.bold('✅ Commit realizado com sucesso.'));
      return;
    }

    // Menu de ações
    const { action } = await inquirer.prompt<{ action: string }>([
      {
        type: 'list',
        name: 'action',
        message: chalk.blue.bold('O que deseja fazer com a mensagem de commit?'),
        choices: [
          { name: '📌 Confirmar e commitar', value: 'confirm' },
          { name: '📝 Editar a mensagem antes de commitar', value: 'edit' },
          { name: '🔄 Regenerar mensagem', value: 'regenerate' },
          { name: '📋 Copiar para clipboard', value: 'copy' },
          { name: '🚫 Cancelar o commit', value: 'cancel' },
        ],
      },
    ]);

    if (action === 'regenerate') {
      // Recursão para regenerar
      return runCommitWizard();
    }

    if (action === 'copy') {
      try {
        execSync(`echo "${response.content}" | pbcopy`, { stdio: 'ignore' });
        console.log(chalk.green('📋 Mensagem copiada para o clipboard!'));
      } catch {
        console.log(chalk.yellow('⚠️ Não foi possível copiar para o clipboard. Mensagem:'));
        console.log(response.content);
      }
      return;
    }

    if (action === 'cancel') {
      console.log(chalk.yellow('🚫 Commit cancelado pelo usuário.'));
      return;
    }

    let finalMessage = response.content;

    if (action === 'edit') {
      const tempFilePath = path.join(os.tmpdir(), 'COMMIT_EDITMSG');
      fs.writeFileSync(tempFilePath, response.content);

      console.log(chalk.cyan('📝 Abrindo editor para edição da mensagem...'));
      const editor = process.env.EDITOR || 'nano';

      try {
        execSync(`${editor} ${tempFilePath}`, { stdio: 'inherit' });
        finalMessage = fs.readFileSync(tempFilePath, 'utf8').trim();
        fs.unlinkSync(tempFilePath);

        if (!finalMessage) {
          console.error(chalk.red('❌ Nenhuma mensagem inserida, commit cancelado.'));
          return;
        }
      } catch (error) {
        console.error(chalk.red('❌ Erro ao abrir o editor:'), error);
        fs.unlinkSync(tempFilePath);
        return;
      }
    }

    // Realiza o commit
    const additionalArgs = process.argv
      .slice(2)
      .filter(arg => !['--config', '--info'].includes(arg));
    gitUtils.commit(finalMessage, additionalArgs);
    console.log(chalk.green.bold('✅ Commit realizado com sucesso.'));

    // Mostra informações do commit criado
    try {
      const commitInfo = gitUtils.getLastCommitInfo();
      console.log(
        chalk.dim(`\n📝 Commit ${commitInfo.hash.substring(0, 7)}: ${commitInfo.message}`)
      );
    } catch {
      // Ignora erros ao obter info do commit
    }
  } catch (error) {
    console.error(chalk.red('❌ Erro durante o commit:'), error);
    process.exit(1);
  }
}

/**
 * Função para multi-commit inteligente
 */
async function runMultiCommit(): Promise<void> {
  const config = loadConfig();

  if (!config.apiKey) {
    console.log(
      chalk.redBright('\n🚨 Erro: A variável de ambiente ') +
        chalk.yellow('OPENAI_API_KEY') +
        chalk.redBright(' não está definida.\n')
    );
    process.exit(1);
  }

  const gitUtils = new GitUtils(config.excludePatterns);
  const aiService = new AIService(config);
  const commitSplitter = new CommitSplitter(gitUtils, config);

  // Verifica se é um repositório Git
  if (!gitUtils.isGitRepository()) {
    console.error(chalk.red('❌ Este diretório não é um repositório git.'));
    process.exit(1);
  }

  // Obtém status dos arquivos staged
  const gitStatus = gitUtils.getStagedStatus();

  if (!gitStatus.hasStagedFiles) {
    console.log(chalk.yellow('⚠️ Não há alterações staged para o commit.'));
    console.log(
      chalk.cyan('💡 Dica: Use ') +
        chalk.white('git add <arquivos>') +
        chalk.cyan(' para adicionar arquivos ao stage.')
    );
    process.exit(0);
  }

  console.log(chalk.blue.bold('\n🎯 Multi-Commit Inteligente'));
  console.log(chalk.gray('Dividindo alterações em commits organizados por contexto...\n'));

  try {
    // Analisa e divide o diff
    const splitResult = await commitSplitter.analyzeAndSplit();

    if (splitResult.groups.length <= 1) {
      console.log(chalk.yellow('📝 Apenas um contexto detectado. Fazendo commit normal...'));
      return runCommitWizard();
    }

    // Exibe preview dos grupos propostos
    console.log(chalk.cyan.bold(`\n📋 ${splitResult.groups.length} commits propostos:`));

    for (let i = 0; i < splitResult.groups.length; i++) {
      const group = splitResult.groups[i];
      console.log(chalk.white(`\n${i + 1}. ${group.emoji} ${group.type}: ${group.description}`));
      console.log(chalk.gray(`   Arquivos (${group.files.length}): ${group.files.join(', ')}`));
    }

    // Confirma se quer prosseguir
    const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Deseja prosseguir com estes commits?',
        default: true,
      },
    ]);

    if (!proceed) {
      console.log(chalk.yellow('🚫 Multi-commit cancelado pelo usuário.'));
      return;
    }

    // Executa commits sequencialmente
    let successCount = 0;
    const totalCommits = splitResult.groups.length;

    for (let i = 0; i < splitResult.groups.length; i++) {
      const group = splitResult.groups[i];

      console.log(
        chalk.blue(`\n[${i + 1}/${totalCommits}] Processando: ${group.emoji} ${group.type}`)
      );

      try {
        // Remove todos os arquivos do stage
        execSync('git reset HEAD .');

        // Adiciona apenas os arquivos deste grupo
        for (const file of group.files) {
          execSync(`git add "${file}"`);
        }

        // Gera mensagem de commit específica para este grupo
        const response = await aiService.generateCommitMessage(group.diff);
        let commitMessage = response.content;

        // Adiciona emoji se configurado
        if (config.includeEmoji && !commitMessage.startsWith(group.emoji)) {
          commitMessage = `${group.emoji} ${commitMessage}`;
        }

        // Realiza o commit
        gitUtils.commit(commitMessage);

        console.log(chalk.green(`✅ Commit ${i + 1}: ${commitMessage.split('\n')[0]}`));
        successCount++;
      } catch (error) {
        console.error(chalk.red(`❌ Erro no commit ${i + 1}:`), error);

        const { continueOnError } = await inquirer.prompt<{ continueOnError: boolean }>([
          {
            type: 'confirm',
            name: 'continueOnError',
            message: 'Deseja continuar com os próximos commits?',
            default: false,
          },
        ]);

        if (!continueOnError) {
          break;
        }
      }
    }

    // Resultado final
    console.log(chalk.cyan.bold(`\n🎉 Multi-commit concluído!`));
    console.log(chalk.white(`• Commits realizados: ${successCount}/${totalCommits}`));

    if (successCount > 0) {
      console.log(chalk.green('✨ Histórico organizado com sucesso!'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Erro durante o multi-commit:'), error);
    process.exit(1);
  }
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Verifica argumentos de linha de comando
  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.blue.bold('\n🧙‍♂️ Commit Wizard - Gerador de commits com IA\n'));
    console.log(chalk.white('Uso: commit-wizard [opções]\n'));
    console.log(chalk.white('Opções:'));
    console.log(chalk.white('  --config, -c      Abrir menu de configuração'));
    console.log(chalk.white('  --info, -i        Mostrar informações do sistema'));
    console.log(chalk.white('  --split, -s       Dividir em múltiplos commits por contexto'));
    console.log(chalk.white('  --help, -h        Mostrar esta ajuda'));
    console.log(chalk.white('\nExemplos:'));
    console.log(chalk.cyan('  commit-wizard                 # Gerar commit normal'));
    console.log(chalk.cyan('  commit-wizard --split         # Multi-commit por contexto'));
    console.log(chalk.cyan('  commit-wizard --config        # Configurar o wizard'));
    console.log(chalk.cyan('  commit-wizard --info          # Ver informações do sistema'));
    return;
  }

  if (args.includes('--config') || args.includes('-c')) {
    await configurationMenu();
    return;
  }

  if (args.includes('--info') || args.includes('-i')) {
    const config = loadConfig();
    const gitUtils = new GitUtils(config.excludePatterns);
    displaySystemInfo(config, gitUtils);
    return;
  }

  if (args.includes('--split') || args.includes('-s')) {
    await runMultiCommit();
    return;
  }

  // Executa o wizard principal
  await runCommitWizard();
}

main().catch(err => {
  console.error(chalk.red('❌ Erro durante execução:'), err);
  process.exit(1);
});
