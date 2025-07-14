#!/bin/bash

# Script para resetar a versão do projeto Commit Wizard
# Uso: ./scripts/reset-version.sh <nova-versao>

set -e

if [ -z "$1" ]; then
  echo "Uso: $0 <nova-versao>"
  echo "Exemplo: $0 2.5.0"
  exit 1
fi

NOVA_VERSAO="$1"

# Sair do modo prerelease (se estiver)
echo "Saindo do modo prerelease (se necessário)..."
npx changeset pre exit || true

echo "Atualizando package.json para a versão $NOVA_VERSAO..."
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.version = '$NOVA_VERSAO'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"

# Limpar changesets aplicados (opcional)
echo "Limpando arquivos .changeset/*.md já aplicados..."
find .changeset -name '*.md' -delete || true

echo "Entrando novamente no modo prerelease canary..."
npx changeset pre enter canary

echo "Criando changeset patch automático para garantir bump canary..."
cat > .changeset/reset-canary-$(date +%s).md <<EOF
---
"@gilbert_oliveira/commit-wizard": patch
---

reset canary
EOF

echo ""
echo "✅ Versão resetada para $NOVA_VERSAO, modo canary ativado e changeset criado."
echo ""
echo "Próximos passos:"
echo "  1. git add package.json .changeset/"
echo "  2. git commit -m 'chore: resetar versão base para $NOVA_VERSAO e ativar canary'"
echo "  3. git push"
echo ""
echo "Agora você pode seguir com novos changesets, canaries ou releases normalmente!" 