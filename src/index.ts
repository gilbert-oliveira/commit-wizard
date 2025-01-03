#!/usr/bin/env ts-node

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';

// Função para verificar se o comando 'cody' está disponível
function isCodyInstalled(): boolean {
  try {
    execSync('cody --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Função para instalar o 'cody' automaticamente
function installCody(): void {
  console.log(chalk.blue('🚀 Instalando o cody automaticamente...'));
  try {
    execSync('npm i -g @sourcegraph/cody', { stdio: 'inherit' });
    console.log(chalk.green('✅ Cody instalado com sucesso!'));
  } catch (error) {
    console.error(chalk.red('❌ Erro ao instalar o Cody:'), (error as Error).message);
    process.exit(1);
  }
}

// Verifica se o 'cody' está instalado, caso contrário, instala
if (!isCodyInstalled()) {
  installCody();
}

// Função para verificar se está logado no cody
function isCodyLoggedIn(): boolean {
  try {
    execSync('cody auth whoami', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Verificar se o usuário está logado no Cody, se não estiver, roda o comando para logar
if (!isCodyLoggedIn()) {
  console.log(chalk.blue('🔑 Realize o login no Cody...'));
  try {
    execSync('cody auth login --web', { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('❌ Erro ao realizar o login no Cody:'), (error as Error).message);
    process.exit(1);
  }
}

// Define o prompt do Cody para geração da mensagem de commit
const CODY_PROMPT = `
Por favor, escreva a mensagem de commit para este diff usando a convenção de Conventional Commits: https://www.conventionalcommits.org/en/v1.0.0/.
A mensagem deve começar com um tipo de commit, como:
  feat: para novas funcionalidades
  fix: para correções de bugs
  chore: para alterações que não afetam a funcionalidade
  docs: para mudanças na documentação
  style: para alterações no estilo do código (como formatação)
  refactor: para alterações no código que não alteram a funcionalidade
  perf: para melhorias de desempenho
  test: para alterações nos testes
  ci: para mudanças no pipeline de integração contínua

Exemplo:
  feat(auth): adicionar suporte ao login com Google

Caso o commit seja uma alteração significativa (breaking change), inclua um título com \`!\` após o tipo de commit e adicione a explicação em \`BREAKING CHANGE\`:
  feat!(auth): reestruturar fluxo de login
  BREAKING CHANGE: A API de login foi alterada e não é compatível com versões anteriores.

Gere também uma descrição mais detalhada do commit, se necessário.

Use sempre linguagem imperativa e primeira pessoa do singular, como:
  - "adiciona recurso"
  - "corrige bug"
  - "remove arquivo"

Lembre-se: os textos fora do Conventional Commit devem ser em português.
`;

interface CommitAction {
  action: 'confirm' | 'edit' | 'cancel';
}

async function ccm(): Promise<void> {
  const prompt = inquirer.createPromptModule();

  // Verifica se o repositório git está inicializado
  try {
    console.log(chalk.blue('🔄 Verificando se o diretório é um repositório git...'));
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (error) {
    console.error(chalk.red('❌ Este diretório não é um repositório git.'));
    return;
  }

  // Verifica se há alterações staged
  const stagedChanges = execSync('git diff --cached --name-only').toString().trim();
  if (!stagedChanges) {
    console.log(chalk.yellow('⚠️ Não há alterações staged para o commit.'));
    return;
  }

  // Cria arquivos temporários para armazenar o prompt e o diff
  const tempPromptPath = path.join(os.tmpdir(), 'CODY_PROMPT.txt');
  const tempDiffPath = path.join(os.tmpdir(), 'CODY_DIFF.patch');
  fs.writeFileSync(tempPromptPath, CODY_PROMPT);
  fs.writeFileSync(tempDiffPath, execSync("git diff --cached --ignore-all-space | grep '^[+-]'").toString());

  // Gera a mensagem do commit usando o diff salvo no arquivo temporário
  let generatedMessage: string;
  try {
    console.log(chalk.blue.bold('⌛ Gerando mensagem de commit com o Cody...'));
    const response = execSync(
      `cody chat --context-file ${tempDiffPath} --stdin -m "$(cat ${tempPromptPath})"`
    ).toString();

    // Extrai o bloco de código delimitado por ``` usando regex
    const match = response.match(/```([\s\S]*?)```/);
    generatedMessage = match ? match[1].trim() : response.trim();

    console.log(chalk.greenBright('\n✨ Mensagem de commit gerada automaticamente:'));
    console.log(chalk.yellowBright(generatedMessage));
  } catch (error) {
    console.error(chalk.red('❌ Erro ao gerar mensagem de commit com o Cody:'), (error as Error).message);
    return;
  } finally {
    fs.unlinkSync(tempPromptPath); // Remove o arquivo temporário do prompt
    fs.unlinkSync(tempDiffPath); // Remove o arquivo temporário do diff
  }

  // Pergunta ao usuário se ele quer editar, confirmar ou cancelar o commit
  const { action }: CommitAction = await prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.blue.bold('O que deseja fazer com a mensagem de commit gerada?'),
      choices: [
        { name: '📌 Confirmar e commitar', value: 'confirm' },
        { name: '📝 Editar a mensagem antes de commitar', value: 'edit' },
        { name: '🚫 Cancelar o commit', value: 'cancel' },
      ],
    },
  ]);

  // Caminho temporário para salvar a mensagem gerada
  const tempFilePath = path.join(os.tmpdir(), 'COMMIT_EDITMSG');
  fs.writeFileSync(tempFilePath, generatedMessage);

  if (action === 'edit') {
    console.log(chalk.cyan('📝 Abrindo editor para edição da mensagem...'));
    const editor = process.env.EDITOR || 'nano';
    try {
      execSync(`${editor} ${tempFilePath}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('❌ Erro ao abrir o editor:'), (error as Error).message);
      return;
    }
  } else if (action === 'cancel') {
    console.log(chalk.yellow('🚫 Commit cancelado pelo usuário.'));
    fs.unlinkSync(tempFilePath);
    return;
  }

  // Lê a mensagem do arquivo temporário após a edição
  const finalMessage = fs.readFileSync(tempFilePath, 'utf8').trim();

  // Verifica se a mensagem está vazia
  if (!finalMessage) {
    console.log(chalk.red('❌ Nenhuma mensagem inserida, commit cancelado.'));
    fs.unlinkSync(tempFilePath);
    return;
  }

  // Captura os argumentos adicionais passados ao script
  const gitArgs = process.argv.slice(2).join(' ');
  console.log(chalk.blue('🔍 Argumentos adicionais para o commit:'), gitArgs);

  // Realiza o commit com a mensagem final e os argumentos adicionais
  try {
    execSync(`git commit -F ${tempFilePath} ${gitArgs}`);
    console.log(chalk.green.bold('✅ Commit realizado com sucesso.'));
  } catch (error) {
    console.error(chalk.red('❌ Erro ao realizar o commit:'), (error as Error).message);
  } finally {
    fs.unlinkSync(tempFilePath);
  }
}

// Chama a função principal
ccm().catch((err) => console.error(chalk.red('❌ Erro durante o commit:'), err));
