import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Lê a versão do package.json dinamicamente
 */
export function getVersion(): string {
  try {
    // Tentar diferentes caminhos para encontrar o package.json
    const possiblePaths = [
      // Caminho relativo ao arquivo atual (para desenvolvimento)
      join(process.cwd(), 'package.json'),
      // Caminho relativo ao binário compilado (para produção)
      join(process.cwd(), '..', 'package.json'),
      // Caminho absoluto baseado no __dirname
      join(__dirname, '..', '..', 'package.json'),
    ];

    for (const packagePath of possiblePaths) {
      try {
        const packageContent = readFileSync(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent);
        
        // Verificar se é realmente o package.json do commit-wizard
        if (packageJson.name === '@gilbert_oliveira/commit-wizard') {
          return packageJson.version;
        }
      } catch {
        // Continuar para o próximo caminho
        continue;
      }
    }

    throw new Error('Package.json não encontrado');
  } catch {
    // Fallback caso não consiga ler o package.json
    console.warn('⚠️ Não foi possível ler a versão do package.json, usando versão padrão');
    return '0.0.0';
  }
} 