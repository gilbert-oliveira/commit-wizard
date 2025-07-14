#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Commit Wizard - Criador de Changeset');
console.log('==========================================\n');

// Verificar se estamos em um repositório git
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
} catch {
  console.error('❌ Erro: Não estamos em um repositório git');
  process.exit(1);
}

// Verificar se há mudanças não commitadas
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.log('⚠️  Aviso: Há mudanças não commitadas');
    console.log('Recomendado: Commit suas mudanças antes de criar o changeset\n');
  }
} catch {
  console.error('❌ Erro ao verificar status do git');
  process.exit(1);
}

// Verificar se o changeset já existe
const changesetDir = '.changeset';
const changesetFiles = fs.existsSync(changesetDir) 
  ? fs.readdirSync(changesetDir).filter(file => file.endsWith('.md'))
  : [];

if (changesetFiles.length > 0) {
  console.log(`📝 Changesets existentes encontrados: ${changesetFiles.length}`);
  changesetFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  console.log('');
}

// Executar o comando changeset
console.log('📝 Criando changeset...\n');
console.log('Instruções:');
console.log('1. Selecione o pacote afetado (geralmente @gilbert_oliveira/commit-wizard)');
console.log('2. Escolha o tipo de mudança:');
console.log('   - major: Breaking changes');
console.log('   - minor: Novas funcionalidades');
console.log('   - patch: Correções de bugs');
console.log('3. Escreva uma descrição clara da mudança');
console.log('4. Pressione Enter para salvar\n');

try {
  execSync('npx changeset', { stdio: 'inherit' });
  console.log('\n✅ Changeset criado com sucesso!');
  console.log('\nPróximos passos:');
  console.log('1. Commit o changeset: git add .changeset/ && git commit -m "chore: add changeset"');
  console.log('2. Push para a branch: git push');
  console.log('3. Crie um PR para main/master');
  console.log('4. Quando mergeado, o release será criado automaticamente');
} catch (error) {
  console.error('\n❌ Erro ao criar changeset:', error.message);
  process.exit(1);
} 