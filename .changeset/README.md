# Changesets

Este diretório contém os changesets do projeto Commit Wizard.

## O que são Changesets?

Changesets são arquivos markdown que descrevem mudanças que devem ser incluídas no próximo release. Eles são usados para:

- Gerenciar versões automaticamente
- Gerar changelogs
- Controlar quando releases são feitos

## Como criar um Changeset

### Método 1: Interativo
```bash
npm run changeset:create
```

### Método 2: Direto
```bash
npx changeset
```

### Método 3: Manual
Crie um arquivo `.changeset/[nome-único].md` com o conteúdo:

```markdown
---
"@gilbert_oliveira/commit-wizard": [major|minor|patch]
---

Descrição da mudança
```

## Tipos de Mudanças

- **major**: Breaking changes (mudanças que quebram compatibilidade)
- **minor**: Novas funcionalidades (compatível)
- **patch**: Correções de bugs (compatível)

## Exemplos

### Nova funcionalidade
```markdown
---
"@gilbert_oliveira/commit-wizard": minor
---

Adiciona suporte para configuração via arquivo .commit-wizardrc
```

### Correção de bug
```markdown
---
"@gilbert_oliveira/commit-wizard": patch
---

Corrige bug na validação de mensagens de commit
```

### Breaking change
```markdown
---
"@gilbert_oliveira/commit-wizard": major
---

Breaking change: Nova API para configuração de prompts
```

## Fluxo de Release

1. Crie um changeset quando fizer mudanças
2. Commit e push do changeset
3. Crie um PR para main/master
4. Quando mergeado, o GitHub Actions criará um PR de release
5. Aprove o PR de release para publicar

## Comandos Úteis

```bash
# Ver status dos changesets
npx changeset status

# Aplicar changesets (atualizar versões)
npx changeset version

# Publicar (apenas em CI)
npx changeset publish
```

## Boas Práticas

1. **Sempre crie changesets** para mudanças que devem gerar release
2. **Use descrições claras** e específicas
3. **Um changeset por mudança** - não combine múltiplas mudanças
4. **Teste antes de criar changeset** - certifique-se que a mudança funciona
5. **Use conventional commits** para facilitar a geração de changelog

## Troubleshooting

### Problema: Changeset não foi aplicado
- Verifique se o arquivo está no formato correto
- Verifique se o nome do pacote está correto
- Execute `npx changeset status` para verificar

### Problema: Release não foi criado
- Verifique se há changesets na branch
- Verifique se o PR foi mergeado na main/master
- Verifique os logs do GitHub Actions

## Links Úteis

- [Documentação do Changesets](https://github.com/changesets/changesets)
- [Fluxo de Release](docs_ai/RELEASE_WORKFLOW.md)
- [GitHub Actions](.github/workflows/)
