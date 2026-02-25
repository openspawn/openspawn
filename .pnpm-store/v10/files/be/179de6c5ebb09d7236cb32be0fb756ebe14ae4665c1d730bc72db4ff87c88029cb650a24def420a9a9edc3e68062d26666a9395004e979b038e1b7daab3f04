"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const StartupChunkDependenciesPlugin = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/runtime/StartupChunkDependenciesPlugin'));
const DynamicFilesystemChunkLoadingRuntimeModule_1 = __importDefault(require("./DynamicFilesystemChunkLoadingRuntimeModule"));
const RemotePublicPathRuntimeModule_1 = __importDefault(require("./RemotePublicPathRuntimeModule"));
class DynamicFilesystemChunkLoadingPlugin {
    constructor(options) {
        this.options = options || {};
        this._asyncChunkLoading = this.options.asyncChunkLoading;
    }
    apply(compiler) {
        const { RuntimeGlobals } = compiler.webpack;
        const chunkLoadingValue = this._asyncChunkLoading
            ? 'async-node'
            : 'require';
        new StartupChunkDependenciesPlugin({
            chunkLoading: chunkLoadingValue,
            asyncChunkLoading: this._asyncChunkLoading,
            //@ts-ignore
        }).apply(compiler);
        compiler.hooks.thisCompilation.tap('DynamicFilesystemChunkLoadingPlugin', (compilation) => {
            // Always enabled
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const isEnabledForChunk = (_) => true;
            const onceForChunkSet = new WeakSet();
            const handler = (chunk, set) => {
                if (onceForChunkSet.has(chunk)) {
                    return;
                }
                onceForChunkSet.add(chunk);
                if (!isEnabledForChunk(chunk)) {
                    return;
                }
                set.add(RuntimeGlobals.moduleFactoriesAddOnly);
                set.add(RuntimeGlobals.hasOwnProperty);
                set.add(RuntimeGlobals.publicPath); // this breaks things
                compilation.addRuntimeModule(chunk, new DynamicFilesystemChunkLoadingRuntimeModule_1.default(set, this.options, {
                    webpack: compiler.webpack,
                }));
            };
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.ensureChunkHandlers)
                .tap('DynamicFilesystemChunkLoadingPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
                .tap('DynamicFilesystemChunkLoadingPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.hmrDownloadManifest)
                .tap('DynamicFilesystemChunkLoadingPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.baseURI)
                .tap('DynamicFilesystemChunkLoadingPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.externalInstallChunk)
                .tap('DynamicFilesystemChunkLoadingPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.onChunksLoaded)
                .tap('DynamicFilesystemChunkLoadingPlugin', handler);
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.ensureChunkHandlers)
                .tap('DynamicFilesystemChunkLoadingPlugin', (chunk, set) => {
                if (!isEnabledForChunk(chunk)) {
                    return;
                }
                set.add(RuntimeGlobals.getChunkScriptFilename);
            });
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.hmrDownloadUpdateHandlers)
                .tap('DynamicFilesystemChunkLoadingPlugin', (chunk, set) => {
                if (!isEnabledForChunk(chunk)) {
                    return;
                }
                set.add(RuntimeGlobals.getChunkUpdateScriptFilename);
                set.add(RuntimeGlobals.moduleCache);
                set.add(RuntimeGlobals.hmrModuleData);
                set.add(RuntimeGlobals.moduleFactoriesAddOnly);
            });
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.hmrDownloadManifest)
                .tap('DynamicFilesystemChunkLoadingPlugin', (chunk, set) => {
                if (!isEnabledForChunk(chunk)) {
                    return;
                }
                set.add(RuntimeGlobals.getUpdateManifestFilename);
            });
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.publicPath)
                .tap('RuntimePlugin', (chunk, set) => {
                const { outputOptions } = compilation;
                const { publicPath: globalPublicPath, scriptType } = outputOptions;
                const entryOptions = chunk.getEntryOptions();
                const publicPath = entryOptions && entryOptions.publicPath !== undefined
                    ? entryOptions.publicPath
                    : globalPublicPath;
                const module = new RemotePublicPathRuntimeModule_1.default(this.options);
                if (publicPath === 'auto' && scriptType !== 'module') {
                    set.add(RuntimeGlobals.global);
                }
                else if (typeof publicPath !== 'string' ||
                    /\[(full)?hash\]/.test(publicPath)) {
                    module.fullHash = true;
                }
                compilation.addRuntimeModule(chunk, module);
                return true;
            });
            compilation.hooks.additionalTreeRuntimeRequirements.tap('StartupChunkDependenciesPlugin', (chunk, set, { chunkGraph }) => {
                // compilation.addRuntimeModule(
                //   chunk,
                //   //@ts-ignore
                //   new FederationModuleInfoRuntimeModule(),
                // );
            });
        });
    }
}
exports.default = DynamicFilesystemChunkLoadingPlugin;
//# sourceMappingURL=CommonJsChunkLoadingPlugin.js.map