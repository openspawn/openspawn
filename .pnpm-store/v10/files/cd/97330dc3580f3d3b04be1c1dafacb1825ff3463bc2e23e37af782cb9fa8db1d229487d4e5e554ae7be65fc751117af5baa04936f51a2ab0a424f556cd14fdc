"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Importing necessary plugins and types
 */
const StreamingTargetPlugin_1 = __importDefault(require("./StreamingTargetPlugin"));
const NodeFederationPlugin_1 = __importDefault(require("./NodeFederationPlugin"));
const webpack_1 = require("@module-federation/enhanced/webpack");
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
/**
 * Class representing a UniversalFederationPlugin
 */
class UniversalFederationPlugin {
    /**
     * Create a UniversalFederationPlugin
     * @param {NodeFederationOptions} options - The options for the plugin
     * @param {NodeFederationContext} context - The context for the plugin
     */
    constructor(options, context) {
        this._options = options || {};
        this.context = context || {};
        this.name = 'ModuleFederationPlugin';
        if (this._options.useRuntimePlugin && this._options.isServer) {
            this._options.runtimePlugins = this._options.runtimePlugins
                ? this._options.runtimePlugins.concat([
                    require.resolve('../runtimePlugin.js'),
                ])
                : [require.resolve('../runtimePlugin.js')];
        }
    }
    updateCompilerOptions(compiler) {
        compiler.options.output.chunkFormat = 'commonjs';
        if (compiler.options.output.enabledLibraryTypes === undefined) {
            compiler.options.output.enabledLibraryTypes = ['commonjs-module'];
        }
        else {
            compiler.options.output.enabledLibraryTypes.push('commonjs-module');
        }
        const chunkFileName = compiler.options?.output?.chunkFilename;
        const uniqueName = compiler?.options?.output?.uniqueName || this._options.name;
        if (typeof chunkFileName === 'string' &&
            uniqueName &&
            !chunkFileName.includes(uniqueName)) {
            const suffix = `-[contenthash].js`;
            compiler.options.output.chunkFilename = chunkFileName.replace('.js', suffix);
        }
    }
    /**
     * Apply the plugin to the compiler
     * @param {Compiler} compiler - The webpack compiler
     */
    apply(compiler) {
        const { isServer, debug, useRuntimePlugin, ...options } = this._options;
        const { webpack } = compiler;
        if (!process.env['FEDERATION_WEBPACK_PATH']) {
            process.env['FEDERATION_WEBPACK_PATH'] = (0, normalize_webpack_path_1.getWebpackPath)(compiler);
        }
        if (isServer ||
            compiler.options.name === 'server' ||
            compiler.options.target === 'node' ||
            compiler.options.target === 'async-node') {
            if (useRuntimePlugin) {
                this.updateCompilerOptions(compiler);
                new webpack_1.ModuleFederationPlugin({
                    ...options,
                }).apply(compiler);
            }
            else {
                new NodeFederationPlugin_1.default(options, this.context).apply(compiler);
                new StreamingTargetPlugin_1.default({ ...options, debug }).apply(compiler);
            }
        }
        else {
            new webpack_1.ModuleFederationPlugin(options).apply(compiler);
        }
    }
}
/**
 * Exporting UniversalFederationPlugin as default
 */
exports.default = UniversalFederationPlugin;
//# sourceMappingURL=UniversalFederationPlugin.js.map