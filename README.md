# 🧙‍♂️ Commit Wizard

> **Gere mensagens de commit inteligentes usando IA**

[![npm version](https://img.shields.io/npm/v/@gilbert_oliveira/commit-wizard.svg)](https://www.npmjs.com/package/@gilbert_oliveira/commit-wizard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CLI que analisa suas mudanças no Git e gera mensagens de commit personalizadas usando IA.

## ✨ Funcionalidades

- **Commit único**: Analisa todas as mudanças e gera uma mensagem coesa
- **Smart Split**: IA agrupa arquivos relacionados em commits lógicos
- **Split Manual**: Divisão manual por arquivo
- **Cache inteligente**: Otimiza performance evitando chamadas repetidas
- **Interface interativa**: Preview e edição de mensagens

## 🚀 Instalação

```bash
npm install -g @gilbert_oliveira/commit-wizard
```

Ou use sem instalar:

```bash
npx @gilbert_oliveira/commit-wizard
```

## ⚡ Uso Rápido

### 1. Configure sua chave OpenAI

```bash
export OPENAI_API_KEY="sua-chave-aqui"
```

### 2. Adicione suas mudanças

```bash
git add .
```

### 3. Execute o commit wizard

```bash
commit-wizard
```

## 📋 Comandos

```bash
commit-wizard                    # Modo interativo
commit-wizard --yes              # Aceitar automaticamente
commit-wizard --smart-split      # Smart Split com IA
commit-wizard --split            # Split manual por arquivo
commit-wizard --dry-run          # Visualizar sem commitar
```

## ⚙️ Configuração

Crie um arquivo `.commit-wizardrc`:

```json
{
  "language": "pt",
  "commitStyle": "conventional",
  "openai": {
    "model": "gpt-4o",
    "maxTokens": 200
  },
  "cache": {
    "enabled": true,
    "ttl": 60
  }
}
```

## 🎨 Estilos de Commit

### Conventional (Padrão)
```
feat(auth): implement user login system
```

### Simple
```
Add user login functionality
```

### Detailed
```
Implement comprehensive user authentication system

This commit introduces a new authentication module that includes:
- User login validation with email/password
- Session management with JWT tokens
```

## 📊 Exemplos

### Commit Único
```bash
git add README.md
commit-wizard
# Resultado: "docs: update project documentation"
```

### Smart Split
```bash
git add src/auth/ src/components/auth/ tests/auth/
commit-wizard --smart-split
# Resultado: 3 commits organizados por contexto
```

## 🐛 Troubleshooting

### Erro: "Chave da OpenAI não encontrada"
```bash
export OPENAI_API_KEY="sua-chave-aqui"
```

### Erro: "Não é um repositório Git"
```bash
git init
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

MIT © [Gilbert Oliveira](https://github.com/gilbert-oliveira)
