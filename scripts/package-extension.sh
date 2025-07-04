#!/bin/bash

# Script para empacotar a extensão do VS Code

echo "🧙‍♂️ Empacotando Commit Wizard Extension..."

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
npm run clean

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Fazer build
echo "🔨 Fazendo build..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -ne 0 ]; then
    echo "❌ Erro no build! Abortando..."
    exit 1
fi

# Verificar se o arquivo de extensão existe
if [ ! -f "dist/extension.js" ]; then
    echo "❌ Arquivo de extensão não encontrado! Verifique o build."
    exit 1
fi

# Instalar vsce se não estiver instalado
if ! command -v vsce &> /dev/null; then
    echo "📦 Instalando vsce..."
    npm install -g @vscode/vsce
fi

# Empacotar a extensão
echo "📦 Empacotando extensão..."
vsce package

# Verificar se o pacote foi criado regex
if [[ $(ls *.vsix) ]]; then
    echo "✅ Extensão empacotada com sucesso!"
    echo "📁 Arquivo: $(ls *.vsix)"
    echo ""
    echo "🚀 Para instalar:"
    echo "   code --install-extension $(ls *.vsix)"
    echo ""
    echo "📢 Para publicar:"
    echo "   vsce publish"
else
    echo "❌ Erro ao empacotar extensão!"
    exit 1
fi 