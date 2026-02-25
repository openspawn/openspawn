'use strict';

var sdk = require('@module-federation/sdk');
var manifest = require('@module-federation/manifest');
var managers = require('@module-federation/managers');
var dtsPlugin = require('@module-federation/dts-plugin');
var ReactBridgePlugin = require('@module-federation/bridge-react-webpack-plugin');
var path = require('node:path');
var fs = require('node:fs');
var remoteEntryPlugin = require('./RemoteEntryPlugin.cjs.js');

const RuntimeToolsPath = require.resolve('@module-federation/runtime-tools');
const PLUGIN_NAME = 'RspackModuleFederationPlugin';
class ModuleFederationPlugin {
    constructor(options) {
        this.name = PLUGIN_NAME;
        this._options = options;
    }
    _patchBundlerConfig(compiler) {
        const { name, experiments } = this._options;
        const definePluginOptions = {};
        if (name) {
            definePluginOptions['FEDERATION_BUILD_IDENTIFIER'] = JSON.stringify(sdk.composeKeyWithSeparator(name, managers.utils.getBuildVersion()));
        }
        // Add FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN
        const disableSnapshot = experiments?.optimization?.disableSnapshot ?? false;
        definePluginOptions['FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN'] =
            disableSnapshot;
        // Determine ENV_TARGET: only if manually specified in experiments.optimization.target
        if (experiments?.optimization &&
            typeof experiments.optimization === 'object' &&
            experiments.optimization !== null &&
            'target' in experiments.optimization) {
            const manualTarget = experiments.optimization.target;
            // Ensure the target is one of the expected values before setting
            if (manualTarget === 'web' || manualTarget === 'node') {
                definePluginOptions['ENV_TARGET'] = JSON.stringify(manualTarget);
            }
        }
        // No inference for ENV_TARGET. If not manually set and valid, it's not defined.
        new compiler.webpack.DefinePlugin(definePluginOptions).apply(compiler);
    }
    _checkSingleton(compiler) {
        let count = 0;
        compiler.options.plugins.forEach((p) => {
            if (typeof p !== 'object' || !p) {
                return;
            }
            if (p['name'] === this.name) {
                count++;
                if (count > 1) {
                    throw new Error(`Detect duplicate register ${this.name},please ensure ${this.name} is singleton!`);
                }
            }
        });
    }
    apply(compiler) {
        sdk.bindLoggerToCompiler(remoteEntryPlugin.logger, compiler, PLUGIN_NAME);
        const { _options: options } = this;
        if (!options.name) {
            throw new Error('[ ModuleFederationPlugin ]: name is required');
        }
        this._checkSingleton(compiler);
        this._patchBundlerConfig(compiler);
        const containerManager = new managers.ContainerManager();
        containerManager.init(options);
        if (containerManager.enable) {
            this._patchChunkSplit(compiler, options.name);
        }
        // must before ModuleFederationPlugin
        new remoteEntryPlugin.RemoteEntryPlugin(options).apply(compiler);
        if (options.experiments?.provideExternalRuntime) {
            if (options.exposes) {
                throw new Error('You can only set provideExternalRuntime: true in pure consumer which not expose modules.');
            }
            const runtimePlugins = options.runtimePlugins || [];
            options.runtimePlugins = runtimePlugins.concat(require.resolve('@module-federation/inject-external-runtime-core-plugin'));
        }
        if (options.experiments?.externalRuntime === true) {
            const Externals = compiler.webpack.ExternalsPlugin;
            new Externals(compiler.options.externalsType || 'global', {
                '@module-federation/runtime-core': '_FEDERATION_RUNTIME_CORE',
            }).apply(compiler);
        }
        options.implementation = options.implementation || RuntimeToolsPath;
        let disableManifest = options.manifest === false;
        let disableDts = options.dts === false;
        if (!disableDts) {
            const dtsPlugin$1 = new dtsPlugin.DtsPlugin(options);
            // @ts-ignore
            dtsPlugin$1.apply(compiler);
            dtsPlugin$1.addRuntimePlugins();
        }
        if (!disableManifest && options.exposes) {
            try {
                options.exposes = containerManager.containerPluginExposesOptions;
            }
            catch (err) {
                if (err instanceof Error) {
                    err.message = `[ ModuleFederationPlugin ]: Manifest will not generate, because: ${err.message}`;
                }
                remoteEntryPlugin.logger.warn(err);
                disableManifest = true;
            }
        }
        new compiler.webpack.container.ModuleFederationPlugin(options).apply(compiler);
        const runtimeESMPath = require.resolve('@module-federation/runtime/dist/index.esm.js', { paths: [options.implementation] });
        compiler.hooks.afterPlugins.tap('PatchAliasWebpackPlugin', () => {
            compiler.options.resolve.alias = {
                ...compiler.options.resolve.alias,
                '@module-federation/runtime$': runtimeESMPath,
            };
        });
        if (!disableManifest) {
            this._statsPlugin = new manifest.StatsPlugin(options, {
                pluginVersion: "0.21.6",
                bundler: 'rspack',
            });
            // @ts-ignore
            this._statsPlugin.apply(compiler);
        }
        const checkBridgeReactInstalled = () => {
            try {
                const userPackageJsonPath = path.resolve(compiler.context, 'package.json');
                if (fs.existsSync(userPackageJsonPath)) {
                    const userPackageJson = JSON.parse(fs.readFileSync(userPackageJsonPath, 'utf-8'));
                    const userDependencies = {
                        ...userPackageJson.dependencies,
                        ...userPackageJson.devDependencies,
                    };
                    return !!userDependencies['@module-federation/bridge-react'];
                }
                return false;
            }
            catch (error) {
                return false;
            }
        };
        const hasBridgeReact = checkBridgeReactInstalled();
        // react bridge plugin
        const shouldEnableBridgePlugin = () => {
            // Priority 1: Explicit enableBridgeRouter configuration
            if (options?.bridge?.enableBridgeRouter === true) {
                return true;
            }
            // Priority 2: Explicit disable via enableBridgeRouter:false or disableAlias:true
            if (options?.bridge?.enableBridgeRouter === false ||
                options?.bridge?.disableAlias === true) {
                if (options?.bridge?.disableAlias === true) {
                    remoteEntryPlugin.logger.warn('⚠️  [ModuleFederationPlugin] The `disableAlias` option is deprecated and will be removed in a future version.\n' +
                        '   Please use `enableBridgeRouter: false` instead:\n' +
                        '   {\n' +
                        '     bridge: {\n' +
                        '       enableBridgeRouter: false  // Use this instead of disableAlias: true\n' +
                        '     }\n' +
                        '   }');
                }
                return false;
            }
            // Priority 3: Automatic detection based on bridge-react installation
            if (hasBridgeReact) {
                remoteEntryPlugin.logger.info('💡 [ModuleFederationPlugin] Detected @module-federation/bridge-react in your dependencies.\n' +
                    '   For better control and to avoid future breaking changes, please explicitly set:\n' +
                    '   {\n' +
                    '     bridge: {\n' +
                    '       enableBridgeRouter: true  // Explicitly enable bridge router\n' +
                    '     }\n' +
                    '   }');
                return true;
            }
            return false;
        };
        if (shouldEnableBridgePlugin()) {
            new ReactBridgePlugin({
                moduleFederationOptions: this._options,
            }).apply(compiler);
        }
    }
    _patchChunkSplit(compiler, name) {
        const { splitChunks } = compiler.options.optimization;
        const patchChunkSplit = (cacheGroup) => {
            switch (typeof cacheGroup) {
                case 'boolean':
                case 'string':
                case 'function':
                    break;
                //  cacheGroup.chunks will inherit splitChunks.chunks, so you only need to modify the chunks that are set separately
                case 'object': {
                    if (cacheGroup instanceof RegExp) {
                        break;
                    }
                    if (!cacheGroup.chunks) {
                        break;
                    }
                    if (typeof cacheGroup.chunks === 'function') {
                        const prevChunks = cacheGroup.chunks;
                        cacheGroup.chunks = (chunk) => {
                            if (chunk.name &&
                                (chunk.name === name || chunk.name === name + '_partial')) {
                                return false;
                            }
                            return prevChunks(chunk);
                        };
                        break;
                    }
                    if (cacheGroup.chunks === 'all') {
                        cacheGroup.chunks = (chunk) => {
                            if (chunk.name &&
                                (chunk.name === name || chunk.name === name + '_partial')) {
                                return false;
                            }
                            return true;
                        };
                        break;
                    }
                    if (cacheGroup.chunks === 'initial') {
                        cacheGroup.chunks = (chunk) => {
                            if (chunk.name &&
                                (chunk.name === name || chunk.name === name + '_partial')) {
                                return false;
                            }
                            return chunk.isOnlyInitial();
                        };
                        break;
                    }
                    break;
                }
            }
        };
        if (!splitChunks) {
            return;
        }
        // 修改 splitChunk.chunks
        patchChunkSplit(splitChunks);
        const { cacheGroups } = splitChunks;
        if (!cacheGroups) {
            return;
        }
        // 修改 splitChunk.cacheGroups[key].chunks
        Object.keys(cacheGroups).forEach((cacheGroupKey) => {
            patchChunkSplit(cacheGroups[cacheGroupKey]);
        });
    }
}
const GetPublicPathPlugin = remoteEntryPlugin.RemoteEntryPlugin;

exports.GetPublicPathPlugin = GetPublicPathPlugin;
exports.ModuleFederationPlugin = ModuleFederationPlugin;
exports.PLUGIN_NAME = PLUGIN_NAME;
//# sourceMappingURL=plugin.cjs.js.map
