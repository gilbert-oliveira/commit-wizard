# 🧙‍♂️ Commit Wizard

[![npm version](https://badge.fury.io/js/%40gilbert_oliveira%2Fcommit-wizard.svg)](https://badge.fury.io/js/%40gilbert_oliveira%2Fcommit-wizard)
[![CI/CD](https://github.com/gilbert-oliveira/commit-wizard/actions/workflows/ci.yml/badge.svg)](https://github.com/gilbert-oliveira/commit-wizard/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/gilbert-oliveira/commit-wizard/branch/main/graph/badge.svg)](https://codecov.io/gh/gilbert-oliveira/commit-wizard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Gere mensagens de commit convencionais automaticamente com base nas alterações no código usando a API da OpenAI.

## ✨ Funcionalidades

- 🤖 **Geração inteligente de commits** usando GPT-4o/GPT-4o Mini
- 📝 **Convenção de Conventional Commits** automática
- 🌍 **Suporte multilíngue** (Português e Inglês)
- ⚙️ **Configuração flexível** (local e global)
- 📊 **Análise de complexidade** do diff
- 🚀 **Auto commit** opcional
- 😀 **Emojis** opcionais nas mensagens
- 🔄 **Regeneração** de mensagens
- 📋 **Cópia para clipboard**
- 🎯 **Detecção de breaking changes**
- 🧪 **Cobertura de testes** completa

## 🚀 Instalação

### Global (Recomendado)
```bash
npm install -g @gilbert_oliveira/commit-wizard
```

### Local
```bash
npm install @gilbert_oliveira/commit-wizard
```

## ⚙️ Configuração

### 1. API Key da OpenAI
Defina sua chave da OpenAI como variável de ambiente:

```bash
export OPENAI_API_KEY=sk-...
```

Adicione isso no seu `.bashrc`, `.zshrc` ou arquivo de ambiente equivalente.

### 2. Configuração do Wizard
Execute o comando de configuração para personalizar o comportamento:

```bash
commit-wizard --config
```

Ou crie um arquivo `.commit-wizard.json` no seu projeto ou diretório home:

```json
{
  "model": "gpt-4o",
  "temperature": 0.2,
  "maxTokens": 1000,
  "language": "pt",
  "autoCommit": false,
  "excludePatterns": ["*.lock*", "*.log", "node_modules/**"],
  "includeEmoji": true
}
```

## 🧠 Como Funciona

1. **Análise**: Lê os arquivos staged (`git diff --cached`)
2. **Processamento**: Divide diff grandes em chunks menores
3. **IA**: Envia para OpenAI com prompts otimizados
4. **Geração**: Cria mensagem seguindo Conventional Commits
5. **Interação**: Permite edição, regeneração ou cópia
6. **Commit**: Executa git commit com a mensagem final

## 📝 Exemplos de Uso

### Uso Básico
```bash
# Adicione arquivos ao stage
git add .

# Execute o wizard
commit-wizard
```

### Comandos Disponíveis
```bash
commit-wizard                 # Gerar commit normal
commit-wizard --config        # Configurar o wizard
commit-wizard --info          # Ver informações do sistema
commit-wizard --help          # Mostrar ajuda
```

### Exemplo de Output
```
📈 Análise do Diff:
• Arquivos alterados: 3
• Linhas adicionadas: +45
• Linhas removidas: -12
• Tokens estimados: 850
• Complexidade: 🟡 Moderada

✨ Mensagem de commit gerada:
feat(auth): adiciona autenticação OAuth2 com Google

💰 Tokens utilizados: 1,234 (prompt: 987, resposta: 247)

O que deseja fazer com a mensagem de commit?
❯ 📌 Confirmar e commitar
  📝 Editar a mensagem antes de commitar
  🔄 Regenerar mensagem
  📋 Copiar para clipboard
  🚫 Cancelar o commit
```

## 🛠 Modelos Suportados

- **GPT-4o** (padrão) - Mais recente e eficiente
- **GPT-4o Mini** - Mais rápido e econômico
- **GPT-4 Turbo** - Versão anterior robusta
- **GPT-3.5 Turbo** - Opção econômica

## 🧪 Scripts de Desenvolvimento

```bash
npm run build         # Compilar TypeScript
npm run dev           # Modo desenvolvimento
npm run test          # Executar testes
npm run test:watch    # Testes em modo watch
npm run test:coverage # Testes com cobertura
npm run lint          # Verificar lint
npm run lint:fix      # Corrigir lint automaticamente
npm run format        # Formatar código
npm run format:check  # Verificar formatação
npm run clean         # Limpar arquivos build
```

## 📊 Conventional Commits Suportados

O wizard gera mensagens seguindo a [especificação Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Novas funcionalidades
- `fix:` - Correções de bugs
- `docs:` - Mudanças na documentação
- `style:` - Formatação, ponto e vírgula, etc.
- `refactor:` - Mudanças que não alteram funcionalidade
- `perf:` - Melhorias de performance
- `test:` - Adição ou correção de testes
- `chore:` - Mudanças em ferramentas, configs, etc.
- `ci:` - Mudanças no CI/CD

### Breaking Changes
Para alterações que quebram compatibilidade:
```
feat!(auth): reestruturar API de login

BREAKING CHANGE: A API de login foi alterada e não é compatível com versões anteriores.
```

## 🎯 Configurações Avançadas

### Padrões de Exclusão
Customize quais arquivos ignorar:
```json
{
  "excludePatterns": [
    "*.lock*",
    "*.log",
    "node_modules/**",
    "dist/**",
    "coverage/**"
  ]
}
```

### Auto Commit
Para fluxos automatizados:
```json
{
  "autoCommit": true
}
```

### Multilíngue
Suporte para português e inglês:
```json
{
  "language": "en"
}
```

## 🚨 Tratamento de Erros

O wizard trata graciosamente:
- ❌ API key não configurada
- ❌ Não é repositório Git
- ❌ Sem arquivos staged
- ❌ Erros da API OpenAI
- ❌ Problemas de conectividade
- ❌ Arquivos de configuração inválidos

## 💡 Dicas de Uso

1. **Stage seletivo**: Use `git add -p` para adicionar mudanças específicas
2. **Configuração por projeto**: Crie `.commit-wizard.json` no projeto
3. **Temperatura baixa**: Use 0.1-0.3 para mensagens mais consistentes
4. **Exclude patterns**: Configure para ignorar arquivos irrelevantes
5. **Auto commit**: Ative apenas em ambientes confiáveis

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Executando Localmente
```bash
git clone https://github.com/gilbert-oliveira/commit-wizard.git
cd commit-wizard
npm install
npm run build
npm link
```

## 📈 Roadmap

- [ ] Suporte a outros provedores de IA (Claude, Gemini)
- [ ] Integração com GitHub Actions
- [ ] Plugin para VS Code
- [ ] Templates de commit customizáveis
- [ ] Integração com Conventional Changelog
- [ ] Suporte a monorepos
- [ ] Cache de respostas IA

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [OpenAI](https://openai.com/) pela API GPT
- [Conventional Commits](https://www.conventionalcommits.org/) pela especificação
- Comunidade open source pelas bibliotecas utilizadas

---

<div align="center">
  <sub>Feito com 💜 por <a href="https://github.com/gilbert-oliveira">Gilbert de Oliveira Santos</a></sub>
</div>