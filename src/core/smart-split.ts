import type { Config } from '../config/index.ts';
import type { CLIArgs } from '../utils/args.ts';
import { getCachedAnalysis, setCachedAnalysis } from './cache.ts';
import { showCommitResult } from '../ui/index.ts';
import { log } from '@clack/prompts';

export interface FileGroup {
  id: string;
  name: string;
  description: string;
  files: string[];
  diff: string;
  confidence: number;
}

export interface SmartSplitResult {
  success: boolean;
  groups?: FileGroup[];
  error?: string;
}

/**
 * Constrói prompt otimizado para análise de contexto
 */
function buildContextAnalysisPrompt(
  files: string[],
  overallDiff: string
): string {
  // Limitar o tamanho do diff para evitar exceder tokens
  const maxDiffLength = 8000; // Limite conservador
  const truncatedDiff =
    overallDiff.length > maxDiffLength
      ? overallDiff.substring(0, maxDiffLength) + '\n... (diff truncado)'
      : overallDiff;

  // Calcular estatísticas básicas
  const totalFiles = files.length;
  const fileTypes = files.reduce(
    (acc, file) => {
      const ext = file.split('.').pop() || 'sem-extensao';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const fileStats = Object.entries(fileTypes)
    .map(([ext, count]) => `${ext}: ${count}`)
    .join(', ');

  return `Analise os arquivos modificados e agrupe em commits lógicos.

ARQUIVOS (${totalFiles}): ${files.join(', ')}
TIPOS: ${fileStats}

DIFF RESUMIDO:
\`\`\`
${truncatedDiff}
\`\`\`

Agrupe arquivos relacionados. Máximo 5 grupos. Responda em JSON:
{
  "groups": [
    {
      "id": "grupo-1",
      "name": "Nome do Grupo",
      "description": "Descrição breve",
      "files": ["arquivo1.ts", "arquivo2.ts"],
      "confidence": 0.8
    }
  ]
}`;
}

/**
 * Constrói prompt de fallback usando apenas nomes de arquivos
 */
function buildFallbackPrompt(files: string[]): string {
  // Agrupar arquivos por diretório
  const filesByDir = files.reduce(
    (acc, file) => {
      const dir = file.split('/').slice(0, -1).join('/') || 'root';
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(file);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const dirStats = Object.entries(filesByDir)
    .map(([dir, files]) => `${dir}: ${files.length} arquivo(s)`)
    .join('\n');

  return `Agrupe estes arquivos em commits lógicos baseado nos diretórios:

ARQUIVOS POR DIRETÓRIO:
${dirStats}

LISTA COMPLETA: ${files.join(', ')}

Agrupe por funcionalidade relacionada. Máximo 5 grupos. JSON:
{
  "groups": [
    {
      "id": "grupo-1",
      "name": "Nome do Grupo",
      "description": "Descrição breve",
      "files": ["arquivo1.ts", "arquivo2.ts"],
      "confidence": 0.7
    }
  ]
}`;
}

/**
 * Analisa o contexto dos arquivos usando IA
 */
export async function analyzeFileContext(
  files: string[],
  overallDiff: string,
  config: Config
): Promise<SmartSplitResult> {
  try {
    if (!config.openai.apiKey) {
      return {
        success: false,
        error: 'Chave da OpenAI não encontrada',
      };
    }

    // Verificar cache primeiro
    const cachedResult = getCachedAnalysis(files, overallDiff);
    if (cachedResult.hit && cachedResult.groups) {
      return {
        success: true,
        groups: cachedResult.groups,
      };
    }

    // Decidir qual prompt usar baseado no tamanho
    const maxDiffLength = 6000; // Limite mais conservador
    const useFallback = overallDiff.length > maxDiffLength;

    const prompt = useFallback
      ? buildFallbackPrompt(files)
      : buildContextAnalysisPrompt(files, overallDiff);

    // Log opcional sobre o uso do fallback
    if (useFallback) {
      console.warn(
        `⚠️  Diff muito grande (${overallDiff.length} chars), usando análise baseada em nomes de arquivos`
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 800, // Reduzido para economizar tokens
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      return {
        success: false,
        error: `Erro da OpenAI (${response.status}): ${errorData.error?.message || 'Erro desconhecido'}`,
      };
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return {
        success: false,
        error: 'OpenAI retornou resposta vazia',
      };
    }

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Resposta da OpenAI não contém JSON válido',
      };
    }

    const analysis = JSON.parse(jsonMatch[0]);

    if (!analysis.groups || !Array.isArray(analysis.groups)) {
      return {
        success: false,
        error: 'Formato de resposta inválido da OpenAI',
      };
    }

    // Validar que todos os arquivos estão incluídos
    const allGroupedFiles = analysis.groups.flatMap(
      (group: any) => group.files || []
    );
    const missingFiles = files.filter(
      (file) => !allGroupedFiles.includes(file)
    );

    if (missingFiles.length > 0) {
      // Adicionar arquivos faltantes ao primeiro grupo
      analysis.groups[0].files = [
        ...(analysis.groups[0].files || []),
        ...missingFiles,
      ];
    }

    const groups = analysis.groups.map((group: any) => ({
      id: group.id || `group-${Math.random().toString(36).substr(2, 9)}`,
      name: group.name || 'Grupo sem nome',
      description: group.description || 'Sem descrição',
      files: group.files || [],
      diff: '', // Será preenchido depois
      confidence: group.confidence || 0.5,
    }));

    // Armazenar no cache
    setCachedAnalysis(files, overallDiff, groups);

    return {
      success: true,
      groups,
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro ao analisar contexto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Gera diff para um grupo de arquivos (otimizado para tokens)
 */
export async function generateGroupDiff(group: FileGroup): Promise<string> {
  const { getFileDiff } = await import('../git/index.ts');

  const diffs = group.files
    .map((file) => {
      try {
        const diff = getFileDiff(file);
        // Limitar tamanho do diff individual
        const maxDiffLength = 4000;
        return diff.length > maxDiffLength
          ? diff.substring(0, maxDiffLength) + '\n... (diff truncado)'
          : diff;
      } catch {
        return '';
      }
    })
    .filter((diff) => diff.length > 0);

  // Se não há diffs válidos, mas há arquivos no grupo,
  // pode ser que os arquivos sejam novos (untracked) ou foram recriados
  if (diffs.length === 0 && group.files.length > 0) {
    // Verificar se os arquivos existem e são novos
    const { execSync } = await import('child_process');

    const newFiles = group.files.filter((file) => {
      try {
        // Verificar se o arquivo existe
        execSync(`test -f "${file}"`, { stdio: 'ignore' });

        // Verificar se é um arquivo novo (não tracked)
        const status = execSync(`git status --porcelain -- "${file}"`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        }).trim();

        // Se começa com ??, é um arquivo novo
        return status.startsWith('??');
      } catch {
        return false;
      }
    });

    if (newFiles.length > 0) {
      // Para arquivos novos, criar um diff simulado mais simples
      return newFiles
        .map((file) => {
          try {
            const content = execSync(`cat "${file}"`, {
              encoding: 'utf-8',
              stdio: 'pipe',
            });
            // Limitar conteúdo do arquivo novo
            const maxContentLength = 2000;
            const truncatedContent =
              content.length > maxContentLength
                ? content.substring(0, maxContentLength) +
                  '\n... (conteúdo truncado)'
                : content;

            return `diff --git a/${file} b/${file}\nnew file mode 100644\nindex 0000000..${Math.random().toString(36).substr(2, 7)}\n--- /dev/null\n+++ b/${file}\n@@ -0,0 +1,${truncatedContent.split('\n').length} @@\n${truncatedContent
              .split('\n')
              .map((line) => `+${line}`)
              .join('\n')}`;
          } catch {
            return '';
          }
        })
        .filter((diff) => diff.length > 0)
        .join('\n');
    }

    // Verificar se há arquivos que foram deletados e recriados
    const recreatedFiles = group.files.filter((file) => {
      try {
        // Verificar se o arquivo existe
        execSync(`test -f "${file}"`, { stdio: 'ignore' });

        // Verificar se está no stage mas não tem diff
        const stagedStatus = execSync(`git diff --cached --name-only`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        })
          .trim()
          .split('\n');

        return stagedStatus.includes(file);
      } catch {
        return false;
      }
    });

    if (recreatedFiles.length > 0) {
      // Para arquivos recriados, criar um diff que mostra o conteúdo atual
      return recreatedFiles
        .map((file) => {
          try {
            const content = execSync(`cat "${file}"`, {
              encoding: 'utf-8',
              stdio: 'pipe',
            });
            // Limitar conteúdo do arquivo recriado
            const maxContentLength = 2000;
            const truncatedContent =
              content.length > maxContentLength
                ? content.substring(0, maxContentLength) +
                  '\n... (conteúdo truncado)'
                : content;

            return `diff --git a/${file} b/${file}\nindex 0000000..${Math.random().toString(36).substr(2, 7)} 100644\n--- a/${file}\n+++ b/${file}\n@@ -1 +1,${truncatedContent.split('\n').length} @@\n${truncatedContent
              .split('\n')
              .map((line) => `+${line}`)
              .join('\n')}`;
          } catch {
            return '';
          }
        })
        .filter((diff) => diff.length > 0)
        .join('\n');
    }
  }

  // Limitar tamanho total do diff combinado
  const combinedDiff = diffs.join('\n');
  const maxTotalLength = 8000;

  return combinedDiff.length > maxTotalLength
    ? combinedDiff.substring(0, maxTotalLength) + '\n... (diff total truncado)'
    : combinedDiff;
}

/**
 * Executa o smart split mode
 */
export async function handleSmartSplitMode(
  gitStatus: any,
  config: Config,
  args: CLIArgs
): Promise<void> {
  if (!args.silent) {
    log.info('🧠 Modo Smart Split ativado - Agrupando arquivos por contexto');
  }

  // Analisar contexto dos arquivos
  if (!args.silent) {
    log.info('🤖 Analisando contexto das mudanças...');
  }

  const analysis = await analyzeFileContext(
    gitStatus.stagedFiles,
    gitStatus.diff,
    config
  );

  if (!analysis.success) {
    if (!args.silent) {
      log.error(`❌ Erro na análise de contexto: ${analysis.error}`);
    }
    return;
  }

  if (!analysis.groups || analysis.groups.length === 0) {
    if (!args.silent) {
      log.error('❌ Nenhum grupo foi criado pela análise');
    }
    return;
  }

  if (!args.silent) {
    log.success(`✅ ${analysis.groups.length} grupo(s) identificado(s):`);
    analysis.groups.forEach((group, index) => {
      log.info(
        `  ${index + 1}. ${group.name} (${group.files.length} arquivo(s))`
      );
      log.info(`     📄 ${group.files.join(', ')}`);
    });
  }

  // Mostrar interface de Smart Split para o usuário decidir
  if (!args.yes && !args.silent) {
    const { showSmartSplitGroups } = await import('../ui/smart-split.ts');
    const userAction = await showSmartSplitGroups(analysis.groups);

    if (userAction.action === 'cancel') {
      if (!args.silent) {
        log.info('❌ Operação cancelada pelo usuário');
      }
      return;
    }

    if (userAction.action === 'manual') {
      // Delegar para modo manual - re-executar com flag split
      const newArgs = { ...args, split: true, smartSplit: false };
      const { main } = await import('./index.ts');
      await main(newArgs);
      return;
    }

    // Se o usuário aceitou, segue com os grupos sugeridos
  }

  // Processar cada grupo
  for (let i = 0; i < analysis.groups.length; i++) {
    const group = analysis.groups[i];

    if (!group) {
      if (!args.silent) {
        log.error(`❌ Grupo ${i + 1} é undefined`);
      }
      continue;
    }

    if (!args.silent) {
      log.info(
        `\n🔄 Processando grupo ${i + 1}/${analysis.groups.length}: ${group.name}`
      );
    }

    // Gerar diff para o grupo
    const groupDiff = await generateGroupDiff(group);

    if (!groupDiff) {
      if (!args.silent) {
        log.warn(`⚠️  Nenhum diff encontrado para o grupo: ${group.name}`);
        log.info(`   📄 Arquivos: ${group.files.join(', ')}`);
        log.info(
          `   💡 Possível causa: arquivos novos, deletados/recriados, ou sem mudanças`
        );
      }
      continue;
    }

    // Gerar mensagem de commit para o grupo
    if (!args.silent) {
      log.info(`🤖 Gerando commit para: ${group.name}`);
    }

    const { generateWithRetry } = await import('./openai.ts');
    const result = await generateWithRetry(groupDiff, config, group.files);

    if (!result.success) {
      if (!args.silent) {
        log.error(
          `❌ Erro ao gerar commit para ${group.name}: ${result.error}`
        );
      }
      continue;
    }

    if (!result.suggestion) {
      if (!args.silent) {
        log.error(`❌ Nenhuma sugestão gerada para ${group.name}`);
      }
      continue;
    }

    // Modo Dry Run
    if (config.dryRun) {
      if (!args.silent) {
        log.info(`🔍 Dry Run - Grupo: ${group.name}`);
        log.info(`📄 Arquivos: ${group.files.join(', ')}`);
        log.info(`💭 Mensagem: "${result.suggestion.message}"`);
      }
      continue;
    }

    // Interface do usuário
    if (args.yes) {
      // Modo automático
      const { executeFileCommit } = await import('../git/index.ts');
      let commitResult;

      // Fazer commit apenas dos arquivos do grupo atual
      if (group.files.length === 1 && group.files[0]) {
        commitResult = executeFileCommit(
          group.files[0],
          result.suggestion.message || ''
        );
      } else {
        // Para múltiplos arquivos, usar commit normal mas com apenas os arquivos do grupo
        const { execSync } = await import('child_process');
        // Importar função de escape do módulo git
        const { escapeShellArg } = await import('../git/index.ts');
        try {
          // Fazer commit apenas dos arquivos do grupo
          const filesArg = group.files.map((f) => escapeShellArg(f)).join(' ');
          const escapedMessage = escapeShellArg(result.suggestion.message || '');
          execSync(
            `git commit ${filesArg} -m ${escapedMessage}`,
            {
              stdio: 'pipe',
            }
          );

          const hash = execSync('git rev-parse HEAD', {
            encoding: 'utf-8',
            stdio: 'pipe',
          }).trim();

          commitResult = {
            success: true,
            hash,
            message: result.suggestion.message || '',
          };
        } catch (error) {
          commitResult = {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Erro desconhecido ao executar commit',
          };
        }
      }

      showCommitResult(
        commitResult.success,
        commitResult.hash,
        commitResult.error
      );
    } else {
      // Modo interativo
      const {
        showCommitPreview,
        editCommitMessage,
        copyToClipboard,
        showCancellation,
      } = await import('../ui/index.ts');

      const uiAction = await showCommitPreview(result.suggestion);

      switch (uiAction.action) {
        case 'commit': {
          const { executeFileCommit } = await import('../git/index.ts');
          let commitResult;

          // Fazer commit apenas dos arquivos do grupo atual
          const commitMessage =
            result.suggestion.message || 'Atualização de arquivos';
          if (group.files.length === 1 && group.files[0]) {
            commitResult = executeFileCommit(group.files[0], commitMessage);
          } else {
            // Para múltiplos arquivos, usar commit normal mas com apenas os arquivos do grupo
            const { execSync } = await import('child_process');
            // Importar função de escape do módulo git
            const { escapeShellArg } = await import('../git/index.ts');
            try {
              // Fazer commit apenas dos arquivos do grupo
              const filesArg = group.files.map((f) => escapeShellArg(f)).join(' ');
              const escapedMessage = escapeShellArg(commitMessage);
              execSync(
                `git commit ${filesArg} -m ${escapedMessage}`,
                {
                  stdio: 'pipe',
                }
              );

              const hash = execSync('git rev-parse HEAD', {
                encoding: 'utf-8',
                stdio: 'pipe',
              }).trim();

              commitResult = { success: true, hash, message: commitMessage };
            } catch (error) {
              commitResult = {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Erro desconhecido ao executar commit',
              };
            }
          }

          showCommitResult(
            commitResult.success,
            commitResult.hash,
            commitResult.error
          );
          break;
        }
        case 'edit': {
          const editAction = await editCommitMessage(result.suggestion.message);
          if (editAction.action === 'commit' && editAction.message) {
            const { executeFileCommit } = await import('../git/index.ts');
            let editCommitResult;

            // Fazer commit apenas dos arquivos do grupo atual
            if (group.files.length === 1 && group.files[0]) {
              editCommitResult = executeFileCommit(
                group.files[0],
                editAction.message || ''
              );
            } else {
              // Para múltiplos arquivos, usar commit normal mas com apenas os arquivos do grupo
              const { execSync } = await import('child_process');
              // Importar função de escape do módulo git
              const { escapeShellArg } = await import('../git/index.ts');
              try {
                // Fazer commit apenas dos arquivos do grupo
                const filesArg = group.files.map((f) => escapeShellArg(f)).join(' ');
                const escapedMessage = escapeShellArg(editAction.message || '');
                execSync(
                  `git commit ${filesArg} -m ${escapedMessage}`,
                  {
                    stdio: 'pipe',
                  }
                );

                const hash = execSync('git rev-parse HEAD', {
                  encoding: 'utf-8',
                  stdio: 'pipe',
                }).trim();

                editCommitResult = {
                  success: true,
                  hash,
                  message: editAction.message || '',
                };
              } catch (error) {
                editCommitResult = {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : 'Erro desconhecido ao executar commit',
                };
              }
            }

            showCommitResult(
              editCommitResult.success,
              editCommitResult.hash,
              editCommitResult.error
            );
          }
          break;
        }
        case 'copy': {
          await copyToClipboard(result.suggestion.message);
          if (!args.silent) {
            log.info('🎯 Mensagem copiada para clipboard');
          }
          break;
        }
        case 'cancel': {
          showCancellation();
          return;
        }
      }
    }

    // Perguntar se quer continuar (exceto em modo automático)
    if (i < analysis.groups.length - 1 && !args.yes) {
      const { askContinueCommits } = await import('../ui/index.ts');
      const remainingGroups = analysis.groups
        .slice(i + 1)
        .filter((g) => g !== undefined)
        .map((g) => g!.name);
      const continueCommits = await askContinueCommits(remainingGroups);

      if (!continueCommits) {
        break;
      }
    }
  }

  if (!args.silent) {
    log.success('✅ Smart Split concluído!');
  }
}
