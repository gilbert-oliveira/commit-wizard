# 🧙‍♂️ Commit Wizard - Extensão VS Code

[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue.svg)](https://marketplace.visualstudio.com/items?itemName=gilbert_oliveira.commit-wizard)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Extensão do VS Code para gerar mensagens de commit convencionais automaticamente usando IA.

## ✨ Funcionalidades

- 🤖 **Geração inteligente de commits** usando GPT-4o/GPT-4o Mini
- 🎯 **Multi-commit inteligente** - divide mudanças por contexto
- 📝 **Conventional Commits** automático
- 🌍 **Suporte a Português e Inglês**
- ⚙️ **Configuração via Settings do VS Code**
- 🚀 **Integração com Git nativo do VS Code**
- 😀 **Emojis opcionais** nas mensagens
- 🔄 **Regeneração e edição** de mensagens
- 📊 **Estatísticas do diff**

## 🚀 Instalação

1. Abra o VS Code
2. Vá para a aba Extensions (`Ctrl+Shift+X`)
3. Pesquise por "Commit Wizard"
4. Clique em "Install"

## ⚙️ Configuração

### 1. API Key da OpenAI

Configure sua API Key da OpenAI:

**Opção 1: Via Settings do VS Code**
1. Abra Settings (`Ctrl+,`)
2. Pesquise por "commit-wizard"
3. Configure a "API Key"

**Opção 2: Via Variável de Ambiente**
```bash
export OPENAI_API_KEY=sk-...
```

### 2. Configurações Disponíveis

Todas as configurações estão disponíveis no Settings do VS Code:

- **API Key**: Sua chave da OpenAI
- **Model**: Modelo de IA (`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`)
- **Language**: Idioma das mensagens (`pt` ou `en`)
- **Temperature**: Criatividade da IA (0.0 - 1.0)
- **Max Tokens**: Limite de tokens (100 - 4000)
- **Include Emoji**: Incluir emojis nas mensagens
- **Auto Commit**: Fazer commit automaticamente
- **Exclude Patterns**: Padrões de arquivos para excluir

## 🎯 Como Usar

### Commit Simples

1. Faça suas alterações no código
2. Adicione os arquivos ao stage (`git add .` ou via Source Control)
3. Abra a Command Palette (`Ctrl+Shift+P`)
4. Execute: `Commit Wizard: Gerar Commit`
5. Revise e confirme a mensagem gerada

### Multi-Commit Inteligente 🆕

Para dividir automaticamente suas mudanças em múltiplos commits organizados:

1. Faça suas alterações (podem ser de vários tipos: fixes, tests, docs, etc.)
2. Adicione todos os arquivos ao stage
3. Execute: `Commit Wizard: Multi-Commit Inteligente`
4. Revise os commits propostos
5. Confirme para executar

**Exemplo de resultado:**
```
🎯 3 commits propostos:

1. 🐛 fix: corrige validação de entrada (2 arquivos)
2. 🧪 test: adiciona testes para autenticação (1 arquivo)  
3. 📚 docs: atualiza documentação da API (1 arquivo)

✅ Commits realizados: 3/3
```

### Atalhos Disponíveis

- **Command Palette**: `Ctrl+Shift+P` → "Commit Wizard"
- **Source Control**: Botões diretamente no painel Git
- **Settings**: `Ctrl+,` → "commit-wizard"

## 🎨 Interface

### Integração com Source Control

A extensão adiciona botões diretamente no painel Source Control do VS Code:

- **🧙‍♂️ Gerar Commit**: Gera um commit único
- **🎯 Multi-Commit**: Divide em múltiplos commits

### Feedback Visual

- **Progress Bar**: Mostra o progresso da geração
- **Notifications**: Confirmações e erros
- **Input Box**: Para editar mensagens antes do commit

## 📋 Tipos de Commit Detectados

O Multi-Commit detecta automaticamente:

- 🐛 **fix** - Correções de bugs
- 🧪 **test** - Testes
- 📚 **docs** - Documentação
- 🔧 **chore** - Configurações
- 💄 **style** - Formatação
- ♻️ **refactor** - Refatoração
- ✨ **feat** - Novas funcionalidades
- 🔄 **ci** - CI/CD

## 🛠️ Troubleshooting

### Erro: "OpenAI API Key não configurada"

1. Verifique se a API Key está configurada no Settings
2. Ou defina a variável de ambiente `OPENAI_API_KEY`
3. Reinicie o VS Code após configurar

### Erro: "Não é um repositório git"

1. Verifique se está em um projeto com Git inicializado
2. Execute `git init` se necessário
3. Abra a pasta do projeto no VS Code

### Erro: "Nenhuma alteração staged"

1. Faça suas alterações no código
2. Use `git add .` ou o Source Control do VS Code
3. Execute o comando novamente

## 🔧 Desenvolvimento

Para desenvolver a extensão:

```bash
# Instalar dependências
npm install

# Compilar
npm run build

# Executar testes
npm test

# Empacotar extensão
npm run package
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Veja nosso [repositório no GitHub](https://github.com/gilbert-oliveira/commit-wizard).

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/gilbert-oliveira/commit-wizard/issues)
- **Email**: contato@gilbert.dev.br
- **Discord**: [Comunidade Dev](https://discord.gg/dev-community)

---

**Feito com ❤️ por [Gilbert Oliveira](https://github.com/gilbert-oliveira)** 