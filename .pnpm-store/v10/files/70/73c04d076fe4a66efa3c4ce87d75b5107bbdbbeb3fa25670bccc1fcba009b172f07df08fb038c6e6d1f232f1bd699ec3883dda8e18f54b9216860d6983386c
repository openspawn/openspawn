/**
 * Map of shared module name to Map of runtime id to Set of exported names
 * @example {
 *   'antd': Set(['Button', 'exportedName2']),
 * }
 */
export type ReferencedExports = Map<string, Set<string>>;
declare const RuntimeModule: typeof import("webpack").RuntimeModule;
declare class SharedUsedExportsOptimizerRuntimeModule extends RuntimeModule {
    private sharedUsedExports;
    constructor(sharedUsedExports: ReferencedExports);
    /**
     * @returns {string | null} runtime code
     */
    generate(): string | null;
}
export default SharedUsedExportsOptimizerRuntimeModule;
