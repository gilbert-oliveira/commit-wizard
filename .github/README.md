# commit-wizard

> **📋 Guia para Contribuidores e Desenvolvedores**
>
> Este README é focado em informações técnicas, CI/CD e desenvolvimento. Para documentação completa do produto, veja o [README principal](../README.md).

[![CI/CD](https://github.com/gilbert-oliveira/commit-wizard/workflows/CI/badge.svg)](https://github.com/gilbert-oliveira/commit-wizard/actions)
[![Security](https://github.com/gilbert-oliveira/commit-wizard/workflows/Segurança/badge.svg)](https://github.com/gilbert-oliveira/commit-wizard/actions)
[![Deploy](https://github.com/gilbert-oliveira/commit-wizard/workflows/Deploy/badge.svg)](https://github.com/gilbert-oliveira/commit-wizard/actions)
[![npm version](https://img.shields.io/npm/v/@gilbert_oliveira/commit-wizard.svg)](https://www.npmjs.com/package/@gilbert_oliveira/commit-wizard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Status do CI/CD

### Pipeline Principal

- ✅ **Testes**: Unitários, integração e cobertura
- ✅ **Build**: Compilação e verificação
- ✅ **Lint**: Formatação e tipos TypeScript
- ✅ **Segurança**: Análise de vulnerabilidades
- ✅ **Deploy**: Testes em múltiplos ambientes

### Métricas de Qualidade

- 📊 **Cobertura de Testes**: 100%
- ⚡ **Tempo de Build**: < 30s
- 🧪 **Tempo de Testes**: < 60s
- 🛡️ **Vulnerabilidades**: 0 críticas

## 📦 Releases

### Última Release

- **Versão**: [![npm version](https://badge.fury.io/js/commit-wizard.svg)](https://badge.fury.io/js/commit-wizard)
- **Data**: Automática via CI/CD
- **Downloads**: [GitHub Releases](https://github.com/gilbert-oliveira/commit-wizard/releases)

### Instalação

```bash
npm install -g @gilbert_oliveira/commit-wizard
```

```bash
npx @gilbert_oliveira/commit-wizard
```

## 🔧 Desenvolvimento

### Pré-requisitos

- Node.js 18+
- Git

### Setup Local

```bash
# Clone o repositório
git clone https://github.com/gilbert-oliveira/commit-wizard.git
cd commit-wizard

# Instale dependências
npm install

# Execute testes
npm run test

# Execute em modo desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev          # Executar em modo dev
npm run build        # Build do projeto
npm run test         # Executar testes
npm run format       # Formatar código

# CI/CD Local
npm run ci:test      # Testes com verbose
npm run ci:build     # Build para CI
npm run ci:lint      # Linting
# Auditoria de segurança pode ser feita com npm audit

# Release
npm run release:patch # Release patch
npm run release:minor # Release minor
npm run release:major # Release major
```

## 🛡️ Segurança

### Análise Automática

- **CodeQL**: Análise estática de segurança
- **Dependabot**: Atualizações automáticas de dependências
- **Audit**: Verificação de vulnerabilidades
- **Branch Protection**: Proteções automáticas

### Relatórios

- [Security Advisories](https://github.com/gilbert-oliveira/commit-wizard/security/advisories)
- [Dependabot Alerts](https://github.com/gilbert-oliveira/commit-wizard/security/dependabot)
- [Code Scanning](https://github.com/gilbert-oliveira/commit-wizard/security/code-scanning)

## 📊 Métricas

### Performance

- **Build Time**: ~15s
- **Test Time**: ~25s
- **Dependencies**: 4 principais

### Qualidade

- **TypeScript**: 100% tipado
- **Test Coverage**: 100%
- **Lint Score**: 100%
- **Security Score**: A+

## 🔄 Workflow

### Desenvolvimento

1. Fork do repositório
2. Criar branch: `git checkout -b feature/nova-funcionalidade`
3. Desenvolver e testar: `npm run test`
4. Commit seguindo conventional commits
5. Push e criar Pull Request

### CI/CD Automático

1. **Push/PR** → Dispara workflows
2. **Testes** → Validação de qualidade
3. **Segurança** → Análise de vulnerabilidades
4. **Build** → Geração de artefatos
5. **Deploy** → Testes em ambientes

### Release

1. **Merge para main** → Deploy automático
2. **Tag de release** → Publicação no NPM
3. **GitHub Release** → Assets disponíveis

## 📈 Roadmap

### Próximas Funcionalidades

- [x] Cache inteligente para análises ✅ **Concluído**
- [ ] Interface de edição de grupos (Smart Split)
- [ ] Integração com mais IDEs
- [ ] Templates customizados
- [ ] Análise de impacto
- [ ] Métricas avançadas

### Melhorias de CI/CD

- [ ] Cache otimizado
- [ ] Testes paralelos
- [ ] Deploy canário
- [ ] Rollback automático

## 🤝 Contribuindo

### Diretrizes

- Siga o [Conventional Commits](https://conventionalcommits.org/)
- Mantenha cobertura de testes em 100%
- Execute `npm run ci:lint` antes de commitar
- Adicione testes para novas funcionalidades

### Processo

1. Abra uma issue descrevendo o problema/melhoria
2. Fork e crie uma branch
3. Desenvolva e teste localmente
4. Crie um Pull Request
5. Aguarde review e CI/CD

## 📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 🔗 Links

- **📖 Documentação Principal**: [README.md](../README.md) - Guia completo para usuários
- **🐛 Issues**: [GitHub Issues](https://github.com/gilbert-oliveira/commit-wizard/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/gilbert-oliveira/commit-wizard/discussions)
- **🛡️ Security**: [Security Policy](SECURITY.md)
- **🤝 Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Desenvolvido com ❤️ usando Node.js e [GitHub Actions](https://github.com/features/actions)**
