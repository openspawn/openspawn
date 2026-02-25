"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommonJsChunkLoadingPlugin_1 = __importDefault(require("./CommonJsChunkLoadingPlugin"));
/**
 * Class representing a StreamingTargetPlugin
 */
class StreamingTargetPlugin {
    /**
     * Create a StreamingTargetPlugin
     * @param {StreamingTargetOptions} options - The options for the plugin
     */
    constructor(options) {
        this.options = options || {};
    }
    /**
     * Apply the plugin to the compiler
     * @param {Compiler} compiler - The webpack compiler
     */
    apply(compiler) {
        // When used with Next.js, context is needed to use Next.js webpack
        const { webpack } = compiler;
        compiler.options.output.chunkFormat = 'commonjs';
        if (compiler.options.output.enabledLibraryTypes === undefined) {
            compiler.options.output.enabledLibraryTypes = ['commonjs-module'];
        }
        else {
            compiler.options.output.enabledLibraryTypes.push('commonjs-module');
        }
        compiler.options.output.chunkLoading = 'async-node';
        // Disable default config
        // FIXME: enabledChunkLoadingTypes is of type 'string[] | undefined'
        // Can't use the 'false' value as it isn't the right format,
        // Emptying it out ensures theres no other readFileVm added to webpack runtime
        compiler.options.output.enabledChunkLoadingTypes = [];
        compiler.options.output.environment = {
            ...compiler.options.output.environment,
            dynamicImport: true,
        };
        new (webpack?.node?.NodeEnvironmentPlugin ||
            require('webpack/lib/node/NodeEnvironmentPlugin'))({
            infrastructureLogging: compiler.options.infrastructureLogging,
        }).apply(compiler);
        new (webpack?.node?.NodeTargetPlugin ||
            require('webpack/lib/node/NodeTargetPlugin'))().apply(compiler);
        new CommonJsChunkLoadingPlugin_1.default({
            asyncChunkLoading: true,
            name: this.options.name,
            remotes: this.options.remotes,
            baseURI: compiler.options.output.publicPath,
            promiseBaseURI: this.options.promiseBaseURI,
            debug: this.options.debug,
        }).apply(compiler);
    }
}
exports.default = StreamingTargetPlugin;
//# sourceMappingURL=StreamingTargetPlugin.js.map