import type { Chunk, Compiler } from 'webpack';
declare const RuntimeModule: typeof import("webpack").RuntimeModule;
import { SyncWaterfallHook } from 'tapable';
interface DynamicFilesystemChunkLoadingRuntimeModuleOptions {
    baseURI: Compiler['options']['output']['publicPath'];
    promiseBaseURI?: string;
    remotes: Record<string, string>;
    name?: string;
    debug?: boolean;
}
interface ChunkLoadingContext {
    webpack: Compiler['webpack'];
}
declare class DynamicFilesystemChunkLoadingRuntimeModule extends RuntimeModule {
    private runtimeRequirements;
    private options;
    private chunkLoadingContext;
    hooks: {
        strategyCase: SyncWaterfallHook<unknown, import("tapable").UnsetAdditionalOptions>;
    };
    private logger;
    constructor(runtimeRequirements: Set<string>, options: DynamicFilesystemChunkLoadingRuntimeModuleOptions, chunkLoadingContext: ChunkLoadingContext);
    /**
     * @private
     * @param {Chunk} chunk chunk
     * @param {string} rootOutputDir root output directory
     * @returns {string} generated code
     */
    _generateBaseUri(chunk: Chunk, rootOutputDir: string): string;
    /**
     * @private
     * @param {unknown[]} items item to log
     */
    _getLogger(...items: unknown[]): string;
    /**
     * @returns {string} runtime code
     */
    generate(): string;
}
export default DynamicFilesystemChunkLoadingRuntimeModule;
