import type { FileGroup } from '../core/smart-split';
export interface SmartSplitAction {
    action: 'proceed' | 'manual' | 'cancel';
    groups?: FileGroup[];
}
/**
 * Interface para escolher entre smart split e split manual
 */
export declare function chooseSplitMode(): Promise<SmartSplitAction>;
/**
 * Exibe os grupos identificados pela IA
 */
export declare function showSmartSplitGroups(groups: FileGroup[]): Promise<SmartSplitAction>;
/**
 * Interface para confirmar commit de um grupo
 */
export declare function confirmGroupCommit(group: FileGroup, message: string): Promise<boolean>;
/**
 * Interface para mostrar progresso do smart split
 */
export declare function showSmartSplitProgress(current: number, total: number, groupName: string): void;
//# sourceMappingURL=smart-split.d.ts.map