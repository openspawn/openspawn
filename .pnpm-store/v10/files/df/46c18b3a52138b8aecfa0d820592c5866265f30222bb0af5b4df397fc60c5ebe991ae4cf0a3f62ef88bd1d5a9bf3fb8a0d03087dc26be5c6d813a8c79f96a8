"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
/**
 * Base Wrapper Plugin Class
 *
 * Why we need a Wrapper layer:
 * 1. Prevent direct references to peer dependency webpack in CommonJS environment, which can lead to inconsistent instances
 * 2. Ensure the FEDERATION_WEBPACK_PATH environment variable is set correctly, which is crucial for module federation to work properly
 * 3. Provide unified plugin initialization logic, reducing code duplication
 *
 * Why we need to set FEDERATION_WEBPACK_PATH:
 * In CommonJS environment, require('webpack') might get a different webpack version than the current compiler instance,
 * which can cause module federation to malfunction. By setting FEDERATION_WEBPACK_PATH, we ensure all internal
 * dependencies use the same webpack instance as the current compiler.
 */
class BaseWrapperPlugin {
    constructor(options, pluginName, coreModulePath) {
        this._options = options;
        this.pluginName = pluginName;
        this.coreModulePath = coreModulePath;
        this.name = pluginName;
    }
    apply(compiler) {
        // Ensure FEDERATION_WEBPACK_PATH environment variable is set correctly
        process.env['FEDERATION_WEBPACK_PATH'] =
            process.env['FEDERATION_WEBPACK_PATH'] || (0, normalize_webpack_path_1.getWebpackPath)(compiler);
        // Dynamically import core plugin
        const CorePlugin = require(this.coreModulePath).default;
        // Create core plugin instance and apply it
        this.createCorePluginInstance(CorePlugin, compiler);
    }
    /**
     * Create core plugin instance
     * Subclasses can override this method to customize instantiation logic
     */
    createCorePluginInstance(CorePlugin, compiler) {
        new CorePlugin(this._options).apply(compiler);
    }
}
exports.default = BaseWrapperPlugin;
//# sourceMappingURL=BaseWrapperPlugin.js.map