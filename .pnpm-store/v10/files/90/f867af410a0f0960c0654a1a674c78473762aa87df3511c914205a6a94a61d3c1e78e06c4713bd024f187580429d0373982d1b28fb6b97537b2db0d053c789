import type { Compiler } from 'webpack';
import type { ModuleFederationPluginOptions } from '../types';
interface DynamicFilesystemChunkLoadingOptions extends ModuleFederationPluginOptions {
    baseURI: Compiler['options']['output']['publicPath'];
    promiseBaseURI?: string;
    remotes: Record<string, string>;
    name?: string;
    asyncChunkLoading: boolean;
    debug?: boolean;
}
declare class DynamicFilesystemChunkLoadingPlugin {
    private options;
    private _asyncChunkLoading;
    constructor(options: DynamicFilesystemChunkLoadingOptions);
    apply(compiler: Compiler): void;
}
export default DynamicFilesystemChunkLoadingPlugin;
