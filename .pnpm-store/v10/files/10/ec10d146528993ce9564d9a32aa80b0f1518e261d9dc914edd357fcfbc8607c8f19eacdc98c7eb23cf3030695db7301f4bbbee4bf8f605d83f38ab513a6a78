import type { Compiler } from 'webpack';
interface EmbedFederationRuntimePluginOptions {
    /**
     * Whether to enable runtime module embedding for all chunks.
     * If false, only chunks that explicitly require it will be embedded.
     */
    enableForAllChunks?: boolean;
}
/**
 * Plugin that embeds Module Federation runtime code into chunks.
 * It ensures proper initialization of federated modules and manages runtime requirements.
 */
declare class EmbedFederationRuntimePlugin {
    private readonly options;
    private readonly processedChunks;
    constructor(options?: EmbedFederationRuntimePluginOptions);
    /**
     * Determines if runtime embedding should be enabled for a given chunk.
     */
    private isEnabledForChunk;
    /**
     * Checks if a hook has already been tapped by this plugin.
     */
    private isHookAlreadyTapped;
    apply(compiler: Compiler): void;
}
export default EmbedFederationRuntimePlugin;
