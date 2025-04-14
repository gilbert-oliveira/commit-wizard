#!/usr/bin/env ts-node

import chalk from 'chalk';
import inquirer from 'inquirer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import ora from 'ora';
import { encode, decode } from 'gpt-tokenizer';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
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

/**
 * Realiza a chamada à API do OpenAI.
 * @param prompt Texto que será enviado como mensagem do usuário.
 * @param mode Define o contexto: 'commit' para gerar mensagem de commit ou outro valor para resumo.
 * @returns Resposta da API (string com a mensagem ou o resumo).
 */
export async function callOpenAI(prompt: string, mode: string = 'commit'): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions';

  // Escolhe o prompt inicial de acordo com o modo.
  const systemPrompt =
    mode === 'commit'
      ? "Você é um assistente que gera mensagens de commit seguindo a convenção do Conventional Commits."
      : "Você é um assistente que resume alterações de código de forma breve, usando linguagem imperativa em português.";

  const body = {
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Erro na API OpenAI: ${response.statusText}`);
  }

  const data = await response.json();
  // Retorna a resposta do primeiro "choice".
  return data.choices[0].message.content.trim();
}

/**
 * Divide o diff em chunks menores com base na contagem de tokens.
 * Utiliza o gpt-tokenizer para garantir que cada chunk não exceda o limite de tokens.
 * @param diff O diff completo em formato de string.
 * @param maxTokens Quantidade máxima de tokens permitida para cada chunk (padrão: 1000 tokens).
 * @returns Array de strings, cada uma representando um chunk.
 */
export function chunkDiff(diff: string, maxTokens: number = 1000): string[] {
  // Codifica o diff para obter o array de tokens.
  const tokens = encode(diff);

  // Se o diff couber em um único chunk, retorna-o diretamente.
  if (tokens.length <= maxTokens) {
    return [diff];
  }

  const chunks: string[] = [];

  // Percorre os tokens de forma que cada chunk contenha no máximo maxTokens tokens.
  for (let i = 0; i < tokens.length; i += maxTokens) {
    const chunkTokens = tokens.slice(i, i + maxTokens);
    const chunkText = decode(chunkTokens);
    chunks.push(chunkText);
  }

  return chunks;
}


// Pré-prompt para a geração da mensagem de commit conforme as convenções
const COMMIT_PROMPT = `
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

async function main(): Promise<void> {
  // Verifica se o diretório é um repositório git.
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch {
    console.error(chalk.red('❌ Este diretório não é um repositório git.'));
    process.exit(1);
  }

  // Verifica se há alterações staged, desconsiderando arquivos .lock
  let stagedFiles: string;
  try {
    stagedFiles = execSync(
      'git diff --cached --name-only -- . ":(exclude)*.lock"',
      { encoding: 'utf8' }
    ).toString().trim();
    if (!stagedFiles) {
      console.log(chalk.yellow('⚠️ Não há alterações staged para o commit.'));
      process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red('❌ Erro ao verificar alterações staged:'), error);
    process.exit(1);
  }

  // Obtém o diff completo das alterações staged, ignorando arquivos .lock
  let diff: string;
  try {
    diff = execSync(
      'git diff --cached -- . ":(exclude)*.lock"',
      { encoding: 'utf8' }
    );
  } catch (error) {
    console.error(chalk.red('❌ Erro ao obter o diff:'), error);
    process.exit(1);
  }

  // Divide o diff em chunks com base no número máximo de tokens.
  const MAX_TOKENS = 1000;
  const chunks = chunkDiff(diff, MAX_TOKENS);
  let inputForCommit: string;

  if (chunks.length === 1) {
    inputForCommit = chunks[0];
  } else {
    // Se houver vários chunks, gera um resumo para todos eles utilizando um único spinner.
    const partialSummaries: string[] = [];
    const chunkSummaryPrefix =
      "A partir do diff abaixo, extraia um resumo breve das alterações (use linguagem imperativa e em português):";
    
    // Inicia um spinner único para todo o processo
    const spinnerSummary = ora("Gerando resumo do commit.").start();

    try {
      for (const chunk of chunks) {
        const prompt = `${chunkSummaryPrefix}\n\n${chunk}`;
        const summary = await callOpenAI(prompt, 'resumo');
        partialSummaries.push(summary);
      }
      spinnerSummary.succeed("Resumo do commit gerado.");
    } catch (error) {
      spinnerSummary.fail("Erro ao gerar resumo do commit.");
      console.error(chalk.red('❌ Erro ao gerar resumo para o commit:'), error);
      process.exit(1);
    }
    inputForCommit = partialSummaries.join("\n\n");
  }

  // Gera a mensagem de commit com o pré-prompt e o diff (ou seus resumos).
  const finalPrompt = `${COMMIT_PROMPT}\n\nDiff:\n\n${inputForCommit}`;
  const spinnerCommit = ora('Gerando mensagem de commit com base no diff...').start();

  let generatedMessage: string;
  try {
    generatedMessage = await callOpenAI(finalPrompt, 'commit');
    // Remove os delimitadores de bloco de código (```)
    generatedMessage = generatedMessage.replace(/```/g, '').trim();
    spinnerCommit.succeed('Mensagem de commit gerada com sucesso.');
  } catch (error) {
    spinnerCommit.fail('Erro ao gerar a mensagem de commit.');
    console.error(chalk.red('❌ Erro ao gerar a mensagem de commit:'), error);
    process.exit(1);
  }

  console.log(chalk.greenBright('\n✨ Mensagem de commit gerada automaticamente:'));
  console.log(chalk.yellowBright(generatedMessage));

  // Pergunta ao usuário se deseja confirmar, editar ou cancelar o commit.
  const promptModule = inquirer.createPromptModule();
  const { action } = await promptModule<{ action: 'confirm' | 'edit' | 'cancel' }>([
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

  // Cria um arquivo temporário para armazenar a mensagem (para edição se necessário).
  const tempFilePath = path.join(os.tmpdir(), 'COMMIT_EDITMSG');
  fs.writeFileSync(tempFilePath, generatedMessage);

  if (action === 'edit') {
    console.log(chalk.cyan('📝 Abrindo editor para edição da mensagem...'));
    const editor = process.env.EDITOR || 'nano';
    try {
      execSync(`${editor} ${tempFilePath}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('❌ Erro ao abrir o editor:'), error);
      process.exit(1);
    }
  } else if (action === 'cancel') {
    console.log(chalk.yellow('🚫 Commit cancelado pelo usuário.'));
    fs.unlinkSync(tempFilePath);
    process.exit(0);
  }

  // Lê a mensagem final (após eventual edição).
  const finalMessage = fs.readFileSync(tempFilePath, 'utf8').trim();
  if (!finalMessage) {
    console.error(chalk.red('❌ Nenhuma mensagem inserida, commit cancelado.'));
    fs.unlinkSync(tempFilePath);
    process.exit(1);
  }

  // Captura quaisquer argumentos adicionais passados para o comando.
  const gitArgs = process.argv.slice(2).join(' ');
  console.log(chalk.blue('🔍 Argumentos adicionais para o commit:'), gitArgs);

  // Realiza o commit com a mensagem final.
  try {
    execSync(`git commit -F ${tempFilePath} ${gitArgs}`, { stdio: 'inherit' });
    console.log(chalk.green.bold('✅ Commit realizado com sucesso.'));
  } catch (error) {
    console.error(chalk.red('❌ Erro ao realizar o commit:'), error);
  } finally {
    fs.unlinkSync(tempFilePath);
  }
}

main().catch((err) => {
  console.error(chalk.red('❌ Erro durante o commit:'), err);
  process.exit(1);
});
