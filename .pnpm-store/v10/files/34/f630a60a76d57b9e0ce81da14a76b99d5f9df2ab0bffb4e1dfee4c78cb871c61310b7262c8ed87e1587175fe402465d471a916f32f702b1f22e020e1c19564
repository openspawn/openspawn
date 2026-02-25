"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_NAME = void 0;
const sdk_1 = require("@module-federation/sdk");
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const bridge_react_webpack_plugin_1 = __importDefault(require("@module-federation/bridge-react-webpack-plugin"));
exports.PLUGIN_NAME = 'ModuleFederationPlugin';
class ModuleFederationPlugin {
    constructor(options) {
        this._options = options;
        this.name = exports.PLUGIN_NAME;
    }
    apply(compiler) {
        (0, sdk_1.bindLoggerToCompiler)(sdk_1.infrastructureLogger, compiler, 'EnhancedModuleFederationPlugin');
        process.env['FEDERATION_WEBPACK_PATH'] =
            process.env['FEDERATION_WEBPACK_PATH'] || (0, normalize_webpack_path_1.getWebpackPath)(compiler);
        const CoreModuleFederationPlugin = require('../lib/container/ModuleFederationPlugin')
            .default;
        this._mfPlugin = new CoreModuleFederationPlugin(this._options);
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
        if (shouldEnableBridgePlugin()) {
            new bridge_react_webpack_plugin_1.default({
                moduleFederationOptions: this._options,
            }).apply(compiler);
        }
    }
}
exports.default = ModuleFederationPlugin;
//# sourceMappingURL=ModuleFederationPlugin.js.map