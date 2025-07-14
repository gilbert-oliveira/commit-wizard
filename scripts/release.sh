#!/bin/bash

# Script de Release Automático para commit-wizard
# Uso: ./scripts/release.sh [patch|minor|major]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[RELEASE]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

erro() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se estamos no branch main
if [ "$(git branch --show-current)" != "main" ]; then
    erro "Você deve estar no branch main para fazer release"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    erro "Há mudanças não commitadas. Faça commit ou stash antes de continuar."
    exit 1
fi

# Verificar se há mudanças significativas no pacote
log "Verificando mudanças no pacote..."
if ! npm run check-changes; then
    warn "Nenhuma mudança significativa detectada no pacote."
    read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Release cancelado pelo usuário."
        exit 0
    fi
fi

# Verificar se o argumento foi fornecido
if [ $# -eq 0 ]; then
    erro "Uso: $0 [patch|minor|major]"
    echo "  patch: 1.0.0 -> 1.0.1 (correções)"
    echo "  minor: 1.0.0 -> 1.1.0 (novas funcionalidades)"
    echo "  major: 1.0.0 -> 2.0.0 (breaking changes)"
    exit 1
fi

RELEASE_TYPE=$1

# Validar tipo de release
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
    erro "Tipo de release inválido: $RELEASE_TYPE"
    echo "Tipos válidos: patch, minor, major"
    exit 1
fi

log "Iniciando release $RELEASE_TYPE..."

# Instalar dependências e executar testes
log "Executando testes..."
npm install
npm run test

# Build do projeto
log "Fazendo build..."
npm run build

# Verificar se o build foi bem-sucedido
if [ ! -f "dist/commit-wizard.js" ]; then
    erro "Build falhou. Verifique os erros acima."
    exit 1
fi

log "Build bem-sucedido!"

# Obter versão atual
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "Versão atual: $CURRENT_VERSION"

# Calcular nova versão
if [ "$RELEASE_TYPE" = "patch" ]; then
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print $1"."$2"."$3+1}')
elif [ "$RELEASE_TYPE" = "minor" ]; then
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print $1"."$2+1".0"}')
elif [ "$RELEASE_TYPE" = "major" ]; then
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{print $1+1".0.0"}')
fi

log "Nova versão: $NEW_VERSION"

# Atualizar package.json
log "Atualizando package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Criar tag
log "Criando tag v$NEW_VERSION..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push das mudanças
log "Fazendo push das mudanças..."
git push origin main
git push origin "v$NEW_VERSION"

# Criar release no GitHub (se gh CLI estiver disponível)
if command -v gh &> /dev/null; then
    log "Criando release no GitHub..."
    
    # Gerar changelog baseado nos commits desde a última tag
    CHANGELOG=$(git log --oneline $(git describe --tags --abbrev=0 HEAD^)..HEAD | grep -v "chore: bump version" | sed 's/^/- /')
    
    if [ -z "$CHANGELOG" ]; then
        CHANGELOG="Sem mudanças significativas desde a última release."
    fi
    
    # Criar release
    gh release create "v$NEW_VERSION" \
        --title "Release v$NEW_VERSION" \
        --notes "$CHANGELOG" \
        --draft=false \
        --prerelease=false
    
    log "Release criada no GitHub!"
fi 