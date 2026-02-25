import { ShareFallback } from './IndependentSharedPlugin';
/**
 * Map of shared module name to Map of runtime id to Set of exported names
 * @example {
 *   'antd': {
 *     'main': Set(['Button', 'exportedName2']),
 *   },
 * }
 */
export type ReferencedExports = Map<string, Map<string, Set<string>>>;
declare const RuntimeModule: typeof import("webpack").RuntimeModule;
declare class IndependentSharedRuntimeModule extends RuntimeModule {
    buildAssets: ShareFallback;
    libraryType: string;
    constructor(buildAssets: ShareFallback, libraryType: string);
    /**
     * @returns {string | null} runtime code
     */
    generate(): string | null;
}
export default IndependentSharedRuntimeModule;
