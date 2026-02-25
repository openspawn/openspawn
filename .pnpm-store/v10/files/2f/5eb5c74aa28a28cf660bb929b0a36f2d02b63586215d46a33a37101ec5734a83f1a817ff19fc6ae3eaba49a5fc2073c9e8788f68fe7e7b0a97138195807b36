import type { Compilation } from 'webpack';
import type { ConsumeOptions } from '../../declarations/plugins/sharing/ConsumeSharedModule';
interface MatchedConfigs<T> {
    resolved: Map<string, T>;
    unresolved: Map<string, T>;
    prefixed: Map<string, T>;
}
export declare function resolveMatchedConfigs<T extends ConsumeOptions>(compilation: Compilation, configs: [string, T][]): Promise<MatchedConfigs<T>>;
export {};
