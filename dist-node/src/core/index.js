import { log } from '@clack/prompts';
import { loadConfig, validateConfig } from '../config/index';
import { isGitRepository, getGitStatus, getDiffStats, executeCommit, executeFileCommit, } from '../git/index';
import { generateWithRetry } from './openai';
import { showCommitPreview, editCommitMessage, copyToClipboard, showCommitResult, showCancellation, selectFilesForCommit, askContinueCommits, } from '../ui/index';
import { chooseSplitMode } from '../ui/smart-split';
import { handleSmartSplitMode } from './smart-split';
import { initializeCache } from './cache';
export async function main(args = {
    silent: false,
    yes: false,
    auto: false,
    split: false,
    smartSplit: false,
    dryRun: false,
    help: false,
    version: false,
}) {
    if (!args.silent) {
        log.info('🚀 Commit Wizard iniciado!');
    }
    // Verificar se estamos em um repositório Git
    if (!isGitRepository()) {
        log.error('❌ Não foi encontrado um repositório Git neste diretório.');
        if (!args.silent) {
            log.info('💡 Execute o comando em um diretório com repositório Git inicializado.');
        }
        process.exit(1);
    }
    // Carregar e validar configuração
    if (!args.silent) {
        log.info('⚙️  Carregando configuração...');
    }
    const config = loadConfig();
    // Inicializar cache global
    initializeCache(config);
    // Sobrescrever configuração com argumentos CLI
    if (args.split) {
        config.splitCommits = true;
    }
    if (args.dryRun) {
        config.dryRun = true;
    }
    const configErrors = validateConfig(config);
    if (configErrors.length > 0) {
        log.error('❌ Erros na configuração:');
        configErrors.forEach((error) => log.error(`  • ${error}`));
        process.exit(1);
    }
    if (!args.silent) {
        log.success(`✅ Configuração carregada (modelo: ${config.openai.model}, idioma: ${config.language})`);
    }
    // Verificar arquivos staged
    if (!args.silent) {
        log.info('📋 Verificando arquivos staged...');
    }
    const gitStatus = getGitStatus();
    if (!gitStatus.hasStaged) {
        log.warn('⚠️  Nenhum arquivo foi encontrado no stage.');
        if (!args.silent) {
            log.info('💡 Use `git add <arquivo>` para adicionar arquivos ao stage antes de gerar o commit.');
        }
        process.exit(0);
    }
    const diffStats = getDiffStats();
    if (!args.silent) {
        log.success(`✅ Encontrados ${gitStatus.stagedFiles.length} arquivo(s) staged:`);
        gitStatus.stagedFiles.forEach((file) => log.info(`  📄 ${file}`));
        log.info(`📊 Estatísticas: +${diffStats.added} -${diffStats.removed} linhas`);
    }
    // Modo Split: escolher entre smart split e split manual
    if (config.splitCommits || args.smartSplit) {
        if (args.yes) {
            // Modo automático: usar smart split
            return await handleSmartSplitMode(gitStatus, config, args);
        }
        else {
            // Modo interativo: perguntar qual tipo de split
            const splitAction = await chooseSplitMode();
            switch (splitAction.action) {
                case 'proceed':
                    return await handleSmartSplitMode(gitStatus, config, args);
                case 'manual':
                    return await handleSplitMode(gitStatus, config, args);
                case 'cancel':
                    showCancellation();
                    return;
            }
        }
    }
    // Gerar mensagem de commit com OpenAI
    if (!args.silent) {
        log.info('🤖 Gerando mensagem de commit com IA...');
    }
    const result = await generateWithRetry(gitStatus.diff, config, gitStatus.stagedFiles);
    if (!result.success) {
        log.error(`❌ Erro ao gerar commit: ${result.error}`);
        process.exit(1);
    }
    if (!result.suggestion) {
        log.error('❌ Nenhuma sugestão foi gerada');
        process.exit(1);
    }
    if (!args.silent) {
        log.success('✨ Mensagem de commit gerada!');
    }
    // Modo Dry Run: apenas mostrar mensagem
    if (config.dryRun) {
        log.info('🔍 Modo Dry Run - Mensagem gerada:');
        log.info(`"${result.suggestion.message}"`);
        log.info('💡 Execute sem --dry-run para fazer o commit');
        return;
    }
    // Modo automático: commit direto
    if (args.yes) {
        const commitResult = executeCommit(result.suggestion.message);
        showCommitResult(commitResult.success, commitResult.hash, commitResult.error);
        return;
    }
    // Interface interativa
    while (true) {
        const uiAction = await showCommitPreview(result.suggestion);
        switch (uiAction.action) {
            case 'commit': {
                // Commit direto com mensagem gerada
                const commitResult = executeCommit(result.suggestion.message);
                showCommitResult(commitResult.success, commitResult.hash, commitResult.error);
                return;
            }
            case 'edit': {
                // Editar mensagem
                const editAction = await editCommitMessage(result.suggestion.message);
                if (editAction.action === 'cancel') {
                    showCancellation();
                    return;
                }
                if (editAction.action === 'commit' && editAction.message) {
                    const editCommitResult = executeCommit(editAction.message);
                    showCommitResult(editCommitResult.success, editCommitResult.hash, editCommitResult.error);
                    return;
                }
                break;
            }
            case 'copy': {
                // Copiar para clipboard
                await copyToClipboard(result.suggestion.message);
                if (!args.silent) {
                    log.info('🎯 Você pode usar a mensagem copiada com: git commit -m "mensagem"');
                }
                return;
            }
            case 'cancel': {
                // Cancelar operação
                showCancellation();
                return;
            }
        }
    }
}
async function handleSplitMode(gitStatus, config, args) {
    if (!args.silent) {
        log.info('🔄 Modo Split ativado - Commits separados por arquivo');
    }
    let remainingFiles = [
        ...gitStatus.stagedFiles,
    ];
    while (remainingFiles.length > 0) {
        // Selecionar arquivos para este commit
        const selectedFiles = args.yes
            ? [remainingFiles[0]] // Modo automático: um arquivo por vez
            : await selectFilesForCommit(remainingFiles);
        if (selectedFiles.length === 0) {
            if (!args.silent) {
                log.info('❌ Nenhum arquivo selecionado');
            }
            break;
        }
        // Gerar diff apenas dos arquivos selecionados
        const { getFileDiff } = await import('../git/index');
        const fileDiffs = selectedFiles
            .filter((file) => file !== undefined)
            .map((file) => {
            try {
                return getFileDiff(file);
            }
            catch (error) {
                log.error(`❌ Erro ao obter diff do arquivo ${file}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                return '';
            }
        })
            .filter((diff) => diff.length > 0)
            .join('\n');
        if (!fileDiffs) {
            if (!args.silent) {
                log.warn('⚠️  Nenhum diff encontrado para os arquivos selecionados');
            }
            remainingFiles = remainingFiles.filter((file) => !selectedFiles.includes(file));
            continue;
        }
        if (!args.silent) {
            log.info(`🤖 Gerando commit para: ${selectedFiles.join(', ')}`);
        }
        const result = await generateWithRetry(fileDiffs, config, selectedFiles.filter((file) => file !== undefined));
        if (!result.success) {
            log.error(`❌ Erro ao gerar commit: ${result.error}`);
            remainingFiles = remainingFiles.filter((file) => !selectedFiles.includes(file));
            continue;
        }
        if (!result.suggestion) {
            log.error('❌ Nenhuma sugestão foi gerada');
            remainingFiles = remainingFiles.filter((file) => !selectedFiles.includes(file));
            continue;
        }
        // Modo Dry Run: apenas mostrar mensagem
        if (config.dryRun) {
            log.info(`🔍 Dry Run - Mensagem para ${selectedFiles.join(', ')}:`);
            log.info(`"${result.suggestion.message}"`);
            remainingFiles = remainingFiles.filter((file) => !selectedFiles.includes(file));
            continue;
        }
        // Modo automático: commit direto
        if (args.yes) {
            // Para múltiplos arquivos, usar commit normal
            // Para arquivo único, usar executeFileCommit
            const commitResult = selectedFiles.length === 1 && selectedFiles[0]
                ? await executeFileCommit(selectedFiles[0], result.suggestion.message)
                : await executeCommit(result.suggestion.message);
            showCommitResult(commitResult.success, commitResult.hash, commitResult.error);
        }
        else {
            // Interface interativa para este commit
            const uiAction = await showCommitPreview(result.suggestion);
            if (uiAction.action === 'commit') {
                const commitResult = selectedFiles.length === 1 && selectedFiles[0]
                    ? await executeFileCommit(selectedFiles[0], result.suggestion.message)
                    : await executeCommit(result.suggestion.message);
                showCommitResult(commitResult.success, commitResult.hash, commitResult.error);
            }
            else if (uiAction.action === 'edit') {
                const editAction = await editCommitMessage(result.suggestion.message);
                if (editAction.action === 'commit' && editAction.message) {
                    const commitResult = selectedFiles.length === 1 && selectedFiles[0]
                        ? await executeFileCommit(selectedFiles[0], editAction.message)
                        : await executeCommit(editAction.message);
                    showCommitResult(commitResult.success, commitResult.hash, commitResult.error);
                }
            }
            else if (uiAction.action === 'copy') {
                await copyToClipboard(result.suggestion.message);
                if (!args.silent) {
                    log.info('🎯 Mensagem copiada para clipboard');
                }
            }
            else if (uiAction.action === 'cancel') {
                showCancellation();
                return;
            }
        }
        // Remover arquivos processados
        remainingFiles = remainingFiles.filter((file) => !selectedFiles.includes(file));
        // Perguntar se quer continuar (exceto em modo automático)
        if (remainingFiles.length > 0 && !args.yes) {
            const continueCommits = await askContinueCommits(remainingFiles);
            if (!continueCommits) {
                break;
            }
        }
    }
    if (!args.silent) {
        log.success('✅ Modo Split concluído!');
    }
}
//# sourceMappingURL=index.js.map