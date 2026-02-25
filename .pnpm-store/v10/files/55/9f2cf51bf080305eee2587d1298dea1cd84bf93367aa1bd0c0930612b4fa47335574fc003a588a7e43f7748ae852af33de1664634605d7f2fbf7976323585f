"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_NAME = void 0;
const sdk_1 = require("@module-federation/sdk");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const bridge_react_webpack_plugin_1 = __importDefault(require("@module-federation/bridge-react-webpack-plugin"));
const BaseWrapperPlugin_1 = __importDefault(require("./BaseWrapperPlugin"));
exports.PLUGIN_NAME = 'ModuleFederationPlugin';
class ModuleFederationPlugin extends BaseWrapperPlugin_1.default {
    constructor(options) {
        super(options, exports.PLUGIN_NAME, '../lib/container/ModuleFederationPlugin');
    }
    createCorePluginInstance(CorePlugin, compiler) {
        (0, sdk_1.bindLoggerToCompiler)(sdk_1.infrastructureLogger, compiler, 'EnhancedModuleFederationPlugin');
        this._mfPlugin = new CorePlugin(this._options);
        this._mfPlugin.apply(compiler);
        const checkBridgeReactInstalled = () => {
            try {
                const userPackageJsonPath = node_path_1.default.resolve(compiler.context, 'package.json');
                if (node_fs_1.default.existsSync(userPackageJsonPath)) {
                    const userPackageJson = JSON.parse(node_fs_1.default.readFileSync(userPackageJsonPath, 'utf-8'));
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
        const shouldEnableBridgePlugin = () => {
            // Priority 1: Explicit enableBridgeRouter configuration
            if (this._options?.bridge?.enableBridgeRouter === true) {
                return true;
            }
            // Priority 2: Explicit disable via enableBridgeRouter:false or disableAlias:true
            if (this._options?.bridge?.enableBridgeRouter === false ||
                this._options?.bridge?.disableAlias === true) {
                if (this._options?.bridge?.disableAlias === true) {
                    sdk_1.infrastructureLogger.warn('⚠️  [ModuleFederationPlugin] The `disableAlias` option is deprecated and will be removed in a future version.\n' +
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
                sdk_1.infrastructureLogger.info('💡 [ModuleFederationPlugin] Detected @module-federation/bridge-react in your dependencies.\n' +
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
        const enableBridgePlugin = shouldEnableBridgePlugin();
        // When bridge plugin is disabled (router disabled), alias to /base entry
        if (!enableBridgePlugin && hasBridgeReact) {
            compiler.hooks.afterPlugins.tap('BridgeReactBaseAliasPlugin', () => {
                try {
                    const path = require('path');
                    const fs = require('fs');
                    const bridgeReactBasePath = path.resolve(compiler.context, 'node_modules/@module-federation/bridge-react/dist/base.es.js');
                    if (!fs.existsSync(bridgeReactBasePath)) {
                        sdk_1.infrastructureLogger.warn('⚠️  [ModuleFederationPlugin] bridge-react /base entry not found, falling back to default entry');
                        return;
                    }
                    compiler.options.resolve.alias = {
                        ...compiler.options.resolve.alias,
                        '@module-federation/bridge-react$': bridgeReactBasePath,
                    };
                    sdk_1.infrastructureLogger.info('✅ [ModuleFederationPlugin] Router disabled - using /base entry (no react-router-dom)');
                }
                catch (error) {
                    sdk_1.infrastructureLogger.warn('⚠️  [ModuleFederationPlugin] Failed to set /base alias, using default entry');
                }
            });
        }
        if (enableBridgePlugin) {
            new bridge_react_webpack_plugin_1.default({
                moduleFederationOptions: this._options,
            }).apply(compiler);
        }
    }
}
exports.default = ModuleFederationPlugin;
//# sourceMappingURL=ModuleFederationPlugin.js.map