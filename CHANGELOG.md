# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2024-01-XX

### ✨ Adicionado
- **Arquitetura modular**: Código refatorado em módulos especializados
- **Sistema de configuração**: Suporte a arquivos `.commit-wizard.json` local e global
- **Menu de configuração interativo**: `commit-wizard --config`
- **Informações do sistema**: `commit-wizard --info`
- **Suporte multilíngue**: Português e Inglês
- **Múltiplos modelos de IA**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo
- **Auto commit**: Opção para fazer commit automaticamente
- **Análise de complexidade**: Estatísticas detalhadas do diff
- **Detecção de breaking changes**: Identificação automática de mudanças incompatíveis
- **Suporte a emojis**: Opção para incluir emojis nas mensagens
- **Regeneração de mensagens**: Opção para gerar nova mensagem
- **Cópia para clipboard**: Copiar mensagem sem fazer commit
- **Informações de uso de tokens**: Exibição do consumo da API
- **Testes unitários**: Cobertura completa de testes
- **CI/CD**: GitHub Actions para testes e publicação
- **Linting e formatação**: ESLint e Prettier configurados
- **Documentação melhorada**: README expandido com exemplos

### 🔧 Melhorado
- **Processamento de diffs grandes**: Divisão inteligente em chunks
- **Tratamento de erros**: Mensagens mais informativas e recuperação gracosa
- **Interface do usuário**: Menu interativo mais intuitivo
- **Performance**: Processamento paralelo de chunks
- **Compatibilidade**: Suporte aprimorado para diferentes ambientes

### 🐛 Corrigido
- **Dependência faltante**: Adicionado `chalk` às dependências
- **Shebang**: Corrigido para `#!/usr/bin/env node`
- **Imports ESM**: Suporte aprimorado para módulos ES
- **Encoding**: Melhor tratamento de caracteres especiais

### 🚀 Tecnológico
- **TypeScript**: Tipagem melhorada e mais rigorosa
- **Módulos ES**: Migração completa para ESM
- **Arquitetura**: Separação de responsabilidades em classes especializadas
- **Configuração**: Sistema flexível de configuração por arquivo
- **Testing**: Jest configurado com cobertura e mocks

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