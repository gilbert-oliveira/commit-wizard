#!/usr/bin/env bun

import chalk from 'chalk'
import { execSync } from 'child_process'
import fs from 'fs'
import inquirer from 'inquirer'
import os from 'os'
import path from 'path'

// Função para verificar se o comando 'cody' está disponível
function isCodyInstalled(): boolean {
  try {
    execSync('cody --version', { stdio: 'ignore' }) // Tentando rodar o comando `cody --version`
    return true
  } catch (error) {
    return false
  }
}

// Função para instalar o 'cody' automaticamente
function installCody(): void {
  console.log(chalk.blue('🚀 Instalando o cody automaticamente...'))
  try {
    execSync('bun i -g @sourcegraph/cody', { stdio: 'inherit' }) // Instalando globalmente com npm
    console.log(chalk.green('✅ Cody instalado com sucesso!'))
  } catch (error) {
    console.error(chalk.red('❌ Erro ao instalar o Cody:'), (error as Error).message)
    process.exit(1) // Finaliza o processo em caso de erro
  }
}

// Verifica se o 'cody' está instalado, caso contrário, instala
if (!isCodyInstalled()) {
  installCody()
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
`

interface CommitAction {
  action: 'confirm' | 'edit' | 'cancel'
}

async function ccm(): Promise<void> {
  const prompt = inquirer.createPromptModule()

  // Adiciona todos os arquivos modificados ao índice
  execSync('git add .')

  // Cria um arquivo temporário para armazenar o prompt
  const tempPromptPath = path.join(os.tmpdir(), 'CODY_PROMPT.txt')
  fs.writeFileSync(tempPromptPath, CODY_PROMPT)

  // Gera a mensagem do commit usando o diff com o cody chat
  let generatedMessage: string
  try {
    console.log(chalk.blue.bold('⌛ Gerando mensagem de commit com o Cody...'))
    const response = execSync(
      `git diff --cached | cody chat --stdin -m "$(cat ${tempPromptPath})"`,
    ).toString()

    // Extrai o bloco de código delimitado por ``` usando regex
    const match = response.match(/```([\s\S]*?)```/)
    generatedMessage = match ? match[1].trim() : response.trim()

    console.log(
      chalk.greenBright('\n✨ Mensagem de commit gerada automaticamente:'),
    )
    console.log(chalk.yellowBright(generatedMessage))
  } catch (error) {
    console.error(
      chalk.red('❌ Erro ao gerar mensagem de commit com o Cody:'),
      (error as Error).message,
    )
    return
  } finally {
    fs.unlinkSync(tempPromptPath) // Remove o arquivo temporário após o uso
  }

  // Pergunta ao usuário se ele quer editar, confirmar ou cancelar o commit
  const { action }: CommitAction = await prompt([
    {
      type: 'list',
      name: 'action',
      message: chalk.blue.bold(
        'O que deseja fazer com a mensagem de commit gerada?',
      ),
      choices: [
        { name: '📌 Confirmar e commitar', value: 'confirm' },
        { name: '📝 Editar a mensagem antes de commitar', value: 'edit' },
        { name: '🚫 Cancelar o commit', value: 'cancel' },
      ],
    },
  ])

  // Caminho temporário para salvar a mensagem gerada
  const tempFilePath = path.join(os.tmpdir(), 'COMMIT_EDITMSG')

  // Salva a mensagem gerada no arquivo temporário
  fs.writeFileSync(tempFilePath, generatedMessage)

  if (action === 'edit') {
    console.log(chalk.cyan('📝 Abrindo editor para edição da mensagem...'))
    const editor = process.env.EDITOR || 'nano'
    try {
      execSync(`${editor} ${tempFilePath}`, { stdio: 'inherit' })
    } catch (error) {
      console.error(chalk.red('❌ Erro ao abrir o editor:'), (error as Error).message)
      return
    }
  } else if (action === 'cancel') {
    console.log(chalk.yellow('🚫 Commit cancelado pelo usuário.'))
    fs.unlinkSync(tempFilePath) // Remove o arquivo temporário
    return
  }

  // Lê a mensagem do arquivo temporário após a edição
  const finalMessage = fs.readFileSync(tempFilePath, 'utf8').trim()

  // Verifica se a mensagem está vazia
  if (!finalMessage) {
    console.log(chalk.red('❌ Nenhuma mensagem inserida, commit cancelado.'))
    fs.unlinkSync(tempFilePath) // Remove o arquivo temporário
    return
  }

  // Realiza o commit com a mensagem final
  try {
    execSync(`git commit -F ${tempFilePath}`)
    console.log(chalk.green.bold('✅ Commit realizado com sucesso.'))
  } catch (error) {
    console.error(chalk.red('❌ Erro ao realizar o commit:'), (error as Error).message)
  } finally {
    fs.unlinkSync(tempFilePath) // Remove o arquivo temporário
  }
}

// Chama a função principal
ccm().catch((err) => console.error(chalk.red('❌ Erro durante o commit:'), err))
