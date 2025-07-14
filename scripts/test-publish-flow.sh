#!/bin/bash

# Script de teste para validar o fluxo de publicação
# Uso: ./scripts/test-publish-flow.sh

set -e

echo "🧪 Testando fluxo de publicação do Commit Wizard..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar dependências
echo "📦 Verificando dependências..."
if ! npm list @changesets/cli > /dev/null 2>&1; then
    echo "❌ @changesets/cli não encontrado"
    exit 1
fi
echo "✅ @changesets/cli instalado"

# Verificar configuração do Changesets
echo "🔧 Verificando configuração do Changesets..."
if [ ! -f ".changeset/config.json" ]; then
    echo "❌ .changeset/config.json não encontrado"
    exit 1
fi
echo "✅ Configuração do Changesets encontrada"

# Verificar workflows do GitHub Actions
echo "⚙️ Verificando workflows do GitHub Actions..."
WORKFLOWS=(
    ".github/workflows/canary.yml"
    ".github/workflows/release.yml"
    ".github/workflows/validate-changesets.yml"
    ".github/workflows/ci.yml"
)

for workflow in "${WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        echo "✅ $workflow encontrado"
    else
        echo "❌ $workflow não encontrado"
        exit 1
    fi
done

# Verificar scripts no package.json
echo "📝 Verificando scripts no package.json..."
REQUIRED_SCRIPTS=(
    "changeset"
    "version"
    "release"
    "release:github"
    "canary"
    "canary:github"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if npm run --silent "$script" --help > /dev/null 2>&1; then
        echo "✅ Script '$script' encontrado"
    else
        echo "❌ Script '$script' não encontrado"
        exit 1
    fi
done

# Testar build
echo "🔨 Testando build..."
if npm run build; then
    echo "✅ Build executado com sucesso"
else
    echo "❌ Erro no build"
    exit 1
fi

# Verificar se o arquivo buildado existe
if [ -f "dist/commit-wizard.js" ]; then
    echo "✅ Arquivo buildado encontrado"
else
    echo "❌ Arquivo buildado não encontrado"
    exit 1
fi

# Testar execução do CLI
echo "🚀 Testando execução do CLI..."
if timeout 5s node dist/commit-wizard.js --help > /dev/null 2>&1; then
    echo "✅ CLI executado com sucesso"
else
    echo "❌ Erro na execução do CLI"
    exit 1
fi

# Verificar configuração de publicação
echo "📦 Verificando configuração de publicação..."
if grep -q '"publishConfig"' package.json; then
    echo "✅ publishConfig configurado"
else
    echo "❌ publishConfig não encontrado"
    exit 1
fi

# Verificar se é um repositório Git
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "✅ Repositório Git válido"
else
    echo "❌ Não é um repositório Git válido"
    exit 1
fi

echo ""
echo "🎉 Todos os testes passaram!"
echo ""
echo "📋 Resumo do fluxo de publicação:"
echo "  • Changesets configurado ✅"
echo "  • Workflows GitHub Actions configurados ✅"
echo "  • Scripts de publicação configurados ✅"
echo "  • Build funcionando ✅"
echo "  • CLI executável ✅"
echo ""
echo "🚀 O projeto está pronto para publicação automatizada!"
echo ""
echo "📝 Próximos passos:"
echo "  1. Criar PR para testar publicação canary"
echo "  2. Fazer merge na main para testar publicação estável"
echo "  3. Verificar publicação no npm e GitHub Packages" 