# 🧙‍♂️ Commit Wizard - Node.js

> **Gere mensagens de commit inteligentes usando IA com Node.js**

Este é o guia para usar o Commit Wizard com Node.js.

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ instalado
- Chave da API OpenAI

### Instalação Global

```bash
npm install -g @gilbert_oliveira/commit-wizard
```

### Uso via npx (sem instalação)

```bash
npx @gilbert_oliveira/commit-wizard
```

## ⚡ Uso Rápido

### 1. Configure sua chave OpenAI

```bash
export OPENAI_API_KEY="sua-chave-aqui"
```

### 2. Faça suas mudanças e adicione ao staging

```bash
git add .
```

### 3. Execute o commit wizard

```bash
commit-wizard
```

## 📋 Comandos CLI

### Modo Básico

```bash
commit-wizard                    # Modo interativo padrão
commit-wizard --yes              # Aceitar automaticamente
commit-wizard --silent           # Modo silencioso
commit-wizard --auto             # Automático (--yes + --silent)
commit-wizard --dry-run          # Visualizar sem commitar
```

### Split de Commits

```bash
commit-wizard --split            # Split manual por arquivo
commit-wizard --smart-split      # Smart Split com IA
commit-wizard --smart-split --yes # Smart Split automático
```

### Ajuda e Informações

```bash
commit-wizard --help             # Mostrar ajuda
commit-wizard --version          # Mostrar versão
```

## ⚙️ Configuração

### Arquivo `.commit-wizardrc`

Crie um arquivo `.commit-wizardrc` no seu projeto ou no diretório home:

```json
{
  "language": "pt",
  "openai": {
    "model": "gpt-4o",
    "maxTokens": 200,
    "temperature": 0.7
  },
  "commit": {
    "autoCommit": false,
    "style": "conventional"
  },
  "smartSplit": {
    "enabled": true,
    "maxGroups": 5
  }
}
```

## 🧪 Desenvolvimento

### Executar com Node.js

```bash
# Desenvolvimento
npm run dev:node

# Build para Node.js
npm run build:node

# Testes com Node.js
npm run test:node
```

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev:node          # Executar em modo dev com Node.js
npm run build:node        # Build do projeto para Node.js
npm run test:node         # Executar testes com Node.js

# CI/CD Local
npm run ci:test:node      # Testes com verbose (Node.js)
npm run ci:build:node     # Build para CI (Node.js)
```

## 🔧 Troubleshooting

### Erro: "Cannot use import statement outside a module"

Certifique-se de que o `package.json` tem `"type": "module"`:

```json
{
  "type": "module"
}
```

### Erro: "Chave da OpenAI não encontrada"

```bash
export OPENAI_API_KEY="sua-chave-aqui"
```

### Erro: "Não é um repositório Git"

```bash
git init
```

## 🤝 Contribuição

Para contribuir com suporte ao Node.js:

1. Teste com Node.js: `npm run test:node`
2. Build com Node.js: `npm run build:node`
3. Execute com Node.js: `npm run dev:node`

## 📝 Licença

MIT © [Gilbert Oliveira](https://github.com/gilbert-oliveira)

---

**💡 Dica:** Use `commit-wizard --smart-split` para organizar automaticamente seus commits e manter um histórico Git limpo e profissional! 