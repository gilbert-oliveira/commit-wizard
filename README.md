# 🧙‍♂️ Commit Wizard

> **Gere mensagens de commit inteligentes usando IA**

[![CI/CD](https://github.com/gilbert-oliveira/commit-wizard/workflows/CI/badge.svg)](https://github.com/gilbert-oliveira/commit-wizard/actions)
[![Security](https://github.com/gilbert-oliveira/commit-wizard/workflows/Segurança/badge.svg)](https://github.com/gilbert-oliveira/commit-wizard/actions)
[![Deploy](https://github.com/gilbert-oliveira/commit-wizard/workflows/Deploy/badge.svg)](https://github.com/gilbert-oliveira/commit-wizard/actions)

[![npm version](https://img.shields.io/npm/v/@gilbert_oliveira/commit-wizard.svg)](https://www.npmjs.com/package/@gilbert_oliveira/commit-wizard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Um CLI desenvolvido para Node.js que analisa suas mudanças no Git e gera mensagens de commit personalizadas usando a API da OpenAI.

## 📊 Status do Projeto

- **✅ Core Functionality**: 100% completo
- **✅ Smart Split**: 100% completo (cache implementado)
- **✅ Testes**: 100% cobertura
- **✅ Documentação**: 100% completa
- **🔄 Distribuição**: 90% (CI/CD configurado, aguardando publicação)
- **🚧 Interface Avançada**: 30% (edição de grupos em desenvolvimento)

## ✨ Funcionalidades

### 🧠 **Geração Inteligente**

- **Commit único**: Analisa todas as mudanças e gera uma mensagem coesa
- **Smart Split**: IA agrupa arquivos relacionados em commits lógicos separados
- **Split Manual**: Divisão manual por arquivo para controle total

### ⚙️ **Configuração Flexível**

- Arquivo `.commit-wizardrc` para personalização
- Suporte a configuração global e local
- Múltiplos modelos OpenAI (GPT-4o, GPT-3.5, etc.)
- Estilos de commit: Conventional, Simple, Detailed

### 🎨 **Interface Rica**

- Interface interativa com opções de edição
- Preview de mensagens antes do commit
- Copiar para clipboard
- Modos silencioso e automático

### 🎯 **Smart Split Avançado**

- Análise de contexto das mudanças
- Agrupamento por funcionalidade, correção, refatoração
- **Cache inteligente** para análises similares
- **Interface de edição** (em desenvolvimento):
  - ✏️ Renomear grupos
  - 📁 Reorganizar arquivos entre grupos
  - ➕ Criar novos grupos
  - 🔗 Mesclar grupos existentes
  - 🗑️ Excluir grupos vazios

---

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

---

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

---

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

---

## ⚙️ Configuração

### Arquivo `.commit-wizardrc`

Crie um arquivo `.commit-wizardrc` no seu projeto ou no diretório home:

```json
{
  "language": "pt",
  "commitStyle": "conventional",
  "autoCommit": false,
  "splitCommits": true,
  "openai": {
    "model": "gpt-4o",
    "maxTokens": 200,
    "temperature": 0.7,
    "timeout": 30000,
    "retries": 2
  },
  "prompt": {
    "includeFileNames": true,
    "includeDiffStats": true,
    "customInstructions": "",
    "maxDiffSize": 8000
  },
  "smartSplit": {
    "enabled": true,
    "minGroupSize": 1,
    "maxGroups": 5,
    "autoEdit": false,
    "confidenceThreshold": 0.7,
    "preferredGroupTypes": ["feat", "fix", "refactor", "test", "docs"]
  },
  "ui": {
    "theme": "auto",
    "showProgress": true,
    "animateProgress": true,
    "compactMode": false
  },
  "cache": {
    "enabled": true, // ✅ Cache inteligente implementado
    "ttl": 60, // Tempo de vida em minutos
    "maxSize": 100 // Máximo de entradas no cache
  },
  "advanced": {
    "maxFileSize": 1024,
    "excludePatterns": ["*.log", "*.tmp", "node_modules/**", ".git/**"],
    "includePatterns": [],
    "enableDebug": false,
    "logLevel": "info"
  }
}
```

### Gerar Configuração Exemplo

```bash
commit-wizard --init   # Cria .commit-wizardrc exemplo
```

---

## 🧠 Smart Split - Funcionalidade Destacada

O Smart Split usa IA para analisar o contexto das suas mudanças e criar commits organizados logicamente.

### Como Funciona

1. **Análise de Contexto**: IA analisa arquivos e diffs
2. **Agrupamento Inteligente**: Agrupa por funcionalidade/correção
3. **Interface de Edição**: Personaliza grupos antes do commit

### Exemplo de Uso

```bash
# Você modificou:
# src/auth/login.ts
# src/auth/register.ts
# src/components/LoginForm.tsx
# tests/auth.test.ts
# docs/authentication.md

commit-wizard --smart-split
```

**Resultado:**

```
🧠 Análise de Contexto
✅ 3 grupo(s) identificado(s):

1. **Sistema de Autenticação**
   📄 src/auth/login.ts, src/auth/register.ts
   💡 Implementação do core de autenticação
   🎯 Confiança: 95%

2. **Interface de Autenticação**
   📄 src/components/LoginForm.tsx
   💡 Componentes de UI para autenticação
   🎯 Confiança: 90%

3. **Documentação e Testes**
   📄 tests/auth.test.ts, docs/authentication.md
   💡 Testes e documentação relacionada
   🎯 Confiança: 85%

? O que você gostaria de fazer?
  ✅ Prosseguir com esta organização
  ✏️ Editar grupos
  ✋ Fazer split manual
  ❌ Cancelar
```

### Interface de Edição

> **🚧 Em desenvolvimento** - A interface de edição de grupos será implementada em breve

Quando implementada, você poderá:

- **📝 Renomear grupos** - Alterar nome e descrição
- **📁 Reorganizar arquivos** - Mover entre grupos
- **➕ Criar novos grupos** - Grupos personalizados
- **🔗 Mesclar grupos** - Combinar grupos existentes
- **🗑️ Excluir grupos** - Remover grupos vazios

---

## 🎨 Estilos de Commit

### Conventional (Padrão)

```
feat(auth): implement user login system

- Add login validation
- Create session management
- Add password encryption
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
- Password encryption using bcrypt
- Error handling for invalid credentials

Files modified:
- src/auth/login.ts: Core login logic
- src/auth/session.ts: Session management
- tests/auth.test.ts: Unit tests
```

---

## 🔧 Variáveis de Ambiente

```bash
# Obrigatório
export OPENAI_API_KEY="sua-chave-aqui"

# Opcionais
export COMMIT_WIZARD_DEBUG="true"      # Ativar debug
export COMMIT_WIZARD_DRY_RUN="true"    # Sempre dry-run
```

---

## 📊 Exemplos Práticos

### Commit Único Simples

```bash
# Modificou apenas README.md
git add README.md
commit-wizard

# Resultado: "docs: update project documentation"
```

### Smart Split para Feature Complexa

```bash
# Implementou sistema completo de autenticação
git add src/auth/ src/components/auth/ tests/auth/ docs/auth.md

commit-wizard --smart-split

# Resultado: 3 commits organizados por contexto
# 1. feat(auth): implement core authentication system
# 2. feat(ui): add authentication components
# 3. test(auth): add comprehensive auth tests
```

### Cache Inteligente

O Commit Wizard usa cache inteligente para otimizar performance:

- **Cache de análises**: Evita chamadas repetidas à OpenAI
- **Hash MD5**: Identifica análises similares automaticamente
- **TTL configurável**: Invalida cache antigo automaticamente
- **Limpeza automática**: Remove entradas antigas quando necessário

### Split Manual para Controle Total

```bash
# Múltiplas mudanças não relacionadas
git add .
commit-wizard --split

# Você escolhe arquivo por arquivo
# Resultado: commits separados para cada mudança
```

---

## 🧪 Desenvolvimento e Testes

### Executar Testes

```bash
npm run test           # Todos os testes
```

### Desenvolvimento Local

```bash
git clone https://github.com/gilbert-oliveira/commit-wizard
cd commit-wizard

npm install
npm run dev
```

### Build

```bash
npm run build
```

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 🐛 Troubleshooting

### Erro: "Chave da OpenAI não encontrada"

```bash
export OPENAI_API_KEY="sua-chave-aqui"
```

### Erro: "Não é um repositório Git"

```bash
git init
```

### Commits muito grandes/pequenos

Ajuste no `.commit-wizardrc`:

```json
{
  "openai": {
    "maxTokens": 300 // Para commits maiores
  },
  "prompt": {
    "maxDiffSize": 16000 // Para diffs maiores
  }
}
```

### Smart Split não cria grupos

- Verifique conexão com internet
- Confirme que há arquivos staged
- Tente com menos arquivos primeiro

---

## 📝 Licença

MIT © [Gilbert Oliveira](https://github.com/gilbert-oliveira)

---

## 🔗 Links Úteis

- [Documentação da OpenAI](https://platform.openai.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Node.js](https://nodejs.org/) (alternativa)
- [📋 Guia para Contribuidores](.github/README.md) - Informações sobre desenvolvimento e CI/CD

---

## 🎯 Roadmap

### ✅ Concluído Recentemente

- [x] **Cache inteligente de análises** - Sistema de cache em memória com TTL configurável
- [x] **Configuração avançada** - 40+ opções de configuração organizadas
- [x] **Testes de integração** - Cobertura end-to-end completa
- [x] **Documentação completa** - README profissional com exemplos práticos
- [x] **CI/CD Pipeline** - Workflows automatizados para testes e build

### 🚧 Em Desenvolvimento

- [ ] **Interface de edição de grupos** - Editar grupos do Smart Split antes do commit
- [ ] **Tema escuro** - Suporte a tema escuro na interface

### 📋 Próximas Funcionalidades

- [ ] **Plugins personalizados** - Sistema extensível de plugins
- [ ] **Integração com VS Code** - Extensão para VS Code
- [ ] **Templates de commit customizados** - Templates personalizáveis
- [ ] **Análise de impacto das mudanças** - Estimativa de impacto

### 🎨 Melhorias Planejadas

- [ ] **Suporte a mais idiomas** - Interface multilíngue
- [ ] **Interface gráfica opcional** - GUI para usuários não-CLI
- [ ] **Hooks personalizáveis** - Hooks para CI/CD
- [ ] **Animações e UX** - Interface mais fluida

---

**💡 Dica:** Use `commit-wizard --smart-split` para organizar automaticamente seus commits e manter um histórico Git limpo e profissional!
