# Changelog - VS Code Extension

Todas as mudanças notáveis da extensão VS Code do Commit Wizard serão documentadas neste arquivo.

## [1.2.2] - 2024-01-XX

### 🎉 Lançamento Inicial da Extensão

- 🚀 **Primeira versão** da extensão VS Code do Commit Wizard
- 🧙‍♂️ **Geração inteligente de commits** integrada ao VS Code
- 🎯 **Multi-commit inteligente** com interface gráfica
- ⚙️ **Configuração via Settings** do VS Code
- 📊 **Progresso visual** durante geração
- 🔄 **Regeneração e edição** de mensagens
- 📋 **Integração com Source Control**

### ✨ Funcionalidades

- **Command Palette**: Acesso via `Ctrl+Shift+P`
- **Source Control**: Botões no painel Git
- **Settings Integration**: Configuração via Settings do VS Code
- **Progress Feedback**: Barra de progresso durante operações
- **Error Handling**: Tratamento de erros com mensagens amigáveis
- **Auto-stage**: Opção para fazer stage automático das alterações

### 🎨 Interface

- **Notifications**: Mensagens de sucesso e erro
- **Input Boxes**: Edição de mensagens de commit
- **Quick Picks**: Seleção de opções (confirmar, editar, regenerar)
- **Progress Bars**: Feedback visual das operações

### 🔧 Comandos Disponíveis

- `commit-wizard.generate`: Gerar commit único
- `commit-wizard.multiCommit`: Multi-commit inteligente
- `commit-wizard.config`: Abrir configurações

### 📋 Configurações

- `commit-wizard.apiKey`: API Key da OpenAI
- `commit-wizard.model`: Modelo de IA
- `commit-wizard.language`: Idioma das mensagens
- `commit-wizard.temperature`: Temperatura da IA
- `commit-wizard.maxTokens`: Limite de tokens
- `commit-wizard.includeEmoji`: Incluir emojis
- `commit-wizard.autoCommit`: Commit automático
- `commit-wizard.excludePatterns`: Padrões de exclusão

### 🛠️ Melhorias Técnicas

- **TypeScript**: Código totalmente tipado
- **ESLint**: Linting configurado
- **Jest**: Testes unitários
- **Build Pipeline**: Processo de build otimizado
- **Error Boundaries**: Tratamento robusto de erros

### 📦 Arquivos da Extensão

- `package.json`: Configuração da extensão
- `src/extension.ts`: Código principal
- `src/diff-processor-vscode.ts`: Processador adaptado
- `.vscode/`: Configurações de desenvolvimento
- `scripts/package-extension.sh`: Script de empacotamento

### 🚀 Próximas Versões

- [ ] Webview personalizada para configuração
- [ ] Suporte a templates de commit
- [ ] Integração com GitHub/GitLab
- [ ] Histórico de commits gerados
- [ ] Análise de qualidade do código
- [ ] Suporte a mais modelos de IA

### 🐛 Correções Conhecidas

- Tratamento de arquivos grandes
- Compatibilidade com diferentes versões do Git
- Suporte a workspaces multi-root

### 📝 Notas

Esta é a primeira versão da extensão VS Code, baseada na versão 1.2.2 do CLI. 
Mantém compatibilidade total com o CLI existente. 