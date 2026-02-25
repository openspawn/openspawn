'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EntryChunkTrackerPlugin_1 = __importDefault(require("./EntryChunkTrackerPlugin"));
const sdk_1 = require("@module-federation/sdk");
const createBundlerLogger = typeof sdk_1.createInfrastructureLogger === 'function'
    ? sdk_1.createInfrastructureLogger
    : sdk_1.createLogger;
/**
 * Class representing a NodeFederationPlugin.
 * @class
 */
class NodeFederationPlugin {
    /**
     * Create a NodeFederationPlugin.
     * @constructor
     * @param {NodeFederationOptions} options - The options for the NodeFederationPlugin
     * @param {Context} context - The context for the NodeFederationPlugin
     */
    constructor({ debug, useRuntimePlugin, ...options }, context) {
        this.logger = createBundlerLogger('[ Node Federation Plugin ]');
        this._options = options || {};
        this.context = context || {};
        this.useRuntimePlugin = useRuntimePlugin || false;
    }
    /**
     * Apply method for the NodeFederationPlugin class.
     * @method
     * @param {Compiler} compiler - The webpack compiler.
     */
    apply(compiler) {
        (0, sdk_1.bindLoggerToCompiler)(this.logger, compiler, 'NodeFederationPlugin');
        const { webpack } = compiler;
        const pluginOptions = this.preparePluginOptions();
        this.updateCompilerOptions(compiler);
        const ModuleFederationPlugin = this.getModuleFederationPlugin(compiler, webpack);
        new ModuleFederationPlugin(pluginOptions).apply(compiler);
        new EntryChunkTrackerPlugin_1.default({}).apply(compiler);
    }
    preparePluginOptions() {
        this._options.runtimePlugins = [
            ...(this.useRuntimePlugin ? [require.resolve('../runtimePlugin')] : []),
            ...(this._options.runtimePlugins || []),
        ];
        return {
            ...this._options,
            remotes: this._options.remotes || {},
            runtimePlugins: this._options.runtimePlugins,
            // enable dts in browser by default
            dts: this._options.dts ?? false,
        };
    }
    updateCompilerOptions(compiler) {
        const chunkFileName = compiler.options?.output?.chunkFilename;
        const uniqueName = compiler?.options?.output?.uniqueName || this._options.name;
        if (typeof chunkFileName === 'string' &&
            uniqueName &&
            !chunkFileName.includes(uniqueName)) {
            const suffix = `-[contenthash].js`;
            compiler.options.output.chunkFilename = chunkFileName.replace('.js', suffix);
        }
    }
    getModuleFederationPlugin(compiler, webpack) {
        let ModuleFederationPlugin;
        try {
            return require('@module-federation/enhanced').ModuleFederationPlugin;
        }
        catch (e) {
            this.logger.error("Can't find @module-federation/enhanced, falling back to webpack ModuleFederationPlugin, this may not work");
            if (this.context.ModuleFederationPlugin) {
                ModuleFederationPlugin = this.context.ModuleFederationPlugin;
            }
            else if (webpack &&
                webpack.container &&
                webpack.container.ModuleFederationPlugin) {
                ModuleFederationPlugin = webpack.container.ModuleFederationPlugin;
            }
            else {
                ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
            }
            return ModuleFederationPlugin;
        }
    }
}
exports.default = NodeFederationPlugin;
//# sourceMappingURL=NodeFederationPlugin.js.map