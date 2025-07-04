# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.2.2] - 2025-01-04

### 🔒 Melhorias de Segurança e Robustez

#### Correções de Problemas de Execução
- **Corrigido**: Erros de "command not found" durante execução de multi-commit
- **Melhorado**: Sanitização de argumentos de comando para evitar injeção de código
- **Melhorado**: Validação mais rigorosa de arquivos de mensagem de commit

#### Melhorias nas Funções de Limpeza
- **`cleanCommitMessage`**: Adiciona filtros para remover nomes de funções TypeScript e comandos shell
- **`cleanApiResponse`**: Melhora filtros para evitar conteúdo problemático da API
- **`cleanDiffOutput`**: Adiciona proteção contra conteúdo malicioso em diffs

#### Melhorias na Execução de Comandos
- **`commitWithFile`**: Adiciona validação de existência e conteúdo de arquivos
- **Força shell `/bin/bash`**: Garante consistência entre diferentes ambientes
- **Locale fixo `LC_ALL=C`**: Evita problemas de codificação
- **Sanitização de argumentos**: Escapa caracteres especiais para evitar injeção

#### Melhorias nos Testes
- **Novos testes**: Validação de arquivos de mensagem inexistentes ou vazios
- **Mocks aprimorados**: Melhor cobertura das funções de filesystem
- **Testes de segurança**: Verificação de sanitização de argumentos

### 🛡️ Segurança
- Proteção contra injeção de comandos shell
- Validação rigorosa de entrada de dados
- Sanitização de argumentos de linha de comando
- Filtros para remover conteúdo potencialmente perigoso

### 🔧 Melhorias Técnicas
- Melhor isolamento de processos
- Manuseio mais robusto de erros
- Validação de dados mais rigorosa
- Execução de comandos mais segura

## [1.2.1] - 2025-01-03

### ✨ Recursos
- Multi-commit inteligente com divisão por contexto
- Limpeza automática de diffs e mensagens de commit
- Validação de mensagens seguindo Conventional Commits

### 🐛 Correções
- Isolamento de streams para evitar contaminação de saída
- Melhor tratamento de caracteres especiais em mensagens

### 🔧 Melhorias
- Arquivo temporário para mensagens de commit
- Validação mais rigorosa de entrada
- Melhor feedback para o usuário

## [1.2.0] - 2025-01-02

### ✨ Recursos
- Suporte a múltiplos modelos de IA
- Configuração de temperatura
- Detecção de breaking changes
- Análise de complexidade de diff

### 🐛 Correções
- Melhor tratamento de erros da API
- Validação de configuração

### 🔧 Melhorias
- Interface de usuário aprimorada
- Melhor documentação
- Testes mais abrangentes

## [1.1.0] - 2025-01-01

### ✨ Recursos
- Geração de commits com IA
- Suporte a Conventional Commits
- Configuração personalizável
- Suporte a emojis

### 🐛 Correções
- Correções iniciais de bugs

### 🔧 Melhorias
- Implementação inicial

## [1.0.26] - 2023-XX-XX

### ✨ Adicionado
- Versão inicial do Commit Wizard
- Geração básica de mensagens de commit usando GPT-4 Turbo
- Suporte para Conventional Commits
- Divisão de diff em chunks
- Interface básica com inquirer
- Edição de mensagens com editor de texto

### Funcionalidades da versão inicial
- Detecção de repositório Git
- Verificação de arquivos staged
- Exclusão automática de arquivos `.lock`
- Geração de mensagens seguindo padrões convencionais
- Opções para confirmar, editar ou cancelar commit

---

## Tipos de Mudanças

- `✨ Adicionado` para novas funcionalidades
- `🔧 Melhorado` para mudanças em funcionalidades existentes
- `🐛 Corrigido` para correções de bugs
- `🚀 Tecnológico` para mudanças técnicas/internas
- `⚠️ Depreciado` para funcionalidades que serão removidas
- `🗑️ Removido` para funcionalidades removidas
- `🔒 Segurança` para correções de vulnerabilidades 