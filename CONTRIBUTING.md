# Guia de Contribuição

Obrigado por considerar contribuir para o commit-wizard! 🎉

## 🚀 Como Contribuir

### Pré-requisitos

- Node.js 18+
- Git
- Conhecimento básico de TypeScript

### Setup Inicial

1. **Fork o repositório**

   ```bash
   # Clone seu fork
   git clone https://github.com/gilbert-oliveira/commit-wizard.git
   cd commit-wizard

   # Adicione o repositório original como upstream
   git remote add upstream https://github.com/gilbert-oliveira/commit-wizard.git
   ```

2. **Instale dependências**

   ```bash
   npm install
   ```

3. **Execute testes**

   ```bash
   npm run test:node
   ```

4. **Execute em modo desenvolvimento**
   ```bash
   npm run dev:node
   ```

## 🔄 Fluxo de Trabalho

### 1. Criar uma Issue

Antes de começar a codar, crie uma issue descrevendo:

- **Problema**: O que precisa ser corrigido
- **Funcionalidade**: O que precisa ser implementado
- **Melhoria**: Como pode ser melhorado

### 2. Criar uma Branch

```bash
# Atualize sua branch main
git checkout main
git pull upstream main

# Crie uma nova branch
git checkout -b feature/nova-funcionalidade
# ou
git checkout -b fix/correcao-bug
# ou
git checkout -b docs/atualizacao-documentacao
```

### 3. Desenvolver

- **Código**: Siga as diretrizes de estilo
- **Testes**: Adicione testes para novas funcionalidades
- **Documentação**: Atualize documentação se necessário
- **Commits**: Use [Conventional Commits](https://conventionalcommits.org/)

### 4. Testar

```bash
# Execute todos os testes
npm run test:node

# Execute testes específicos
node --test tests/unit.test.ts

# Verifique formatação
npx prettier --write .

# Verifique tipos
npx tsc --noEmit

# Execute linting
npx eslint .
```

### 5. Commit e Push

```bash
# Adicione suas mudanças
git add .

# Faça commit seguindo conventional commits
git commit -m "feat: adiciona nova funcionalidade X"

# Push para seu fork
git push origin feature/nova-funcionalidade
```

### 6. Pull Request

1. Vá para [Pull Requests](https://github.com/gilbert-oliveira/commit-wizard/pulls)
2. Clique em "New Pull Request"
3. Selecione sua branch
4. Preencha o template
5. Aguarde review

## 📝 Diretrizes de Código

### Estrutura do Projeto

```
commit-wizard/
├── bin/                    # Entry point CLI
├── src/                    # Código fonte
│   ├── config/            # Configuração
│   ├── core/              # Lógica principal
│   ├── git/               # Funções Git
│   ├── ui/                # Interface CLI
│   └── utils/             # Utilitários
├── tests/                 # Testes de integração
├── docs_ai/               # Documentação
└── scripts/               # Scripts de build/release
```

### Convenções de Código

#### TypeScript

```typescript
// ✅ Bom
interface CommitConfig {
  openai: {
    apiKey: string;
    model: string;
  };
}

// ❌ Evite
interface CommitConfig {
  openai: any;
}
```

#### Funções

```typescript
// ✅ Bom
export async function generateCommitMessage(
  diff: string,
  config: CommitConfig
): Promise<string> {
  // implementação
}

// ❌ Evite
export async function gen(d: string, c: any): Promise<string> {
  // implementação
}
```

#### Testes

```typescript
// ✅ Bom
describe('generateCommitMessage', () => {
  it('should generate message for feature changes', async () => {
    const diff = 'feat: add new feature';
    const config = { openai: { apiKey: 'test' } };

    const result = await generateCommitMessage(diff, config);

    expect(result).toContain('feat');
  });
});
```

### Conventional Commits

```bash
# ✅ Bom
git commit -m "feat: adiciona suporte a templates customizados"
git commit -m "fix: corrige validação de configuração"
git commit -m "docs: atualiza README com novos exemplos"
git commit -m "test: adiciona testes para smart split"
git commit -m "refactor: simplifica lógica de parsing"

# ❌ Evite
git commit -m "adiciona coisa nova"
git commit -m "fix"
git commit -m "wip"
```

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
npm run test:node

# Testes específicos
node --test tests/unit.test.ts
node --test tests/integration.test.ts

# Com cobertura
# (ajustar comando de cobertura para Node.js se necessário)

# Em modo watch
# (modo watch pode ser implementado com ferramentas Node.js)
```

### Escrevendo Testes

```typescript
// Teste unitário
describe('Config', () => {
  it('should load default config', () => {
    const config = loadConfig();
    expect(config.openai.model).toBe('gpt-4o');
  });
});

// Teste de integração
describe('CLI Integration', () => {
  it('should generate commit message', async () => {
    // Setup
    const tempDir = await createTempRepo();

    // Action
    const result = await runCLI(['--dry-run'], { cwd: tempDir });

    // Assert
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('commit message');
  });
});
```

## 📚 Documentação

### Atualizando Documentação

- **README.md**: Documentação principal
- **docs_ai/**: Documentação técnica
- **JSDoc**: Comentários em código


### Exemplo de JSDoc

````typescript
/**
 * Gera uma mensagem de commit usando OpenAI
 * @param diff - Diff do Git em formato string
 * @param config - Configuração do OpenAI
 * @returns Promise<string> - Mensagem de commit gerada
 * @throws {Error} Se a API key não for válida
 * @example
 * ```typescript
 * const message = await generateCommitMessage(
 *   'feat: add new feature',
 *   { openai: { apiKey: 'sk-...' } }
 * );
 * ```
 */
export async function generateCommitMessage(
  diff: string,
  config: CommitConfig
): Promise<string> {
  // implementação
}
````

## 🔧 Scripts Úteis

```bash
# Desenvolvimento
npm run dev:node          # Executar em modo dev
npm run build        # Build do projeto
npm run test:node         # Executar testes
npm run format       # Formatar código

# CI/CD Local
npm run ci:test      # Testes com verbose
npm run ci:build     # Build para CI
npm run ci:lint      # Linting
npm run ci:security  # Auditoria de segurança

# Release
npm run release:patch # Release patch
npm run release:minor # Release minor
npm run release:major # Release major
```

## 🚨 Troubleshooting

### Problemas Comuns

**Build falha:**

```bash
# Limpar cache
rm -rf node_modules
npm install

# Verificar TypeScript
npm run tsc --noEmit
```

**Testes falham:**

```bash
# Executar testes específicos
node --test tests/unit.test.ts

# Verificar configuração
cat .commit-wizardrc
```

**Lint falha:**

```bash
# Formatar código
npm run format

# Verificar tipos
npm run type-check
```

## 🤝 Review Process

### Checklist para PRs

- [ ] Código segue as diretrizes de estilo
- [ ] Testes passam localmente
- [ ] Documentação foi atualizada
- [ ] Commits seguem conventional commits
- [ ] Não há warnings ou erros
- [ ] Cobertura de testes mantida

### Respondendo a Reviews

- **Aceite sugestões**: Use "Resolve conversation"
- **Discuta mudanças**: Responda nos comentários
- **Faça ajustes**: Commit e push novamente
- **Mantenha foco**: Resolva um ponto por vez

## 🎉 Reconhecimento

Contribuidores serão listados em:

- [Contributors](https://github.com/gilbert-oliveira/commit-wizard/graphs/contributors)
- [README.md](../README.md#contributors)
- [CHANGELOG.md](../CHANGELOG.md)

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/gilbert-oliveira/commit-wizard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gilbert-oliveira/commit-wizard/discussions)
- **Email**: [contribute@gilbert.dev.br](mailto:contribute@gilbert.dev.br)

## 📝 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a [MIT License](LICENSE).

---

**Obrigado por contribuir para o commit-wizard! 🚀**
