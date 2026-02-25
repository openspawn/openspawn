"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const Compilation = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/Compilation'));
const tapable_1 = require("tapable");
/** @type {WeakMap<import("webpack").Compilation, CompilationHooks>} */
const compilationHooksMap = new WeakMap();
const PLUGIN_NAME = 'FederationModulesPlugin';
class FederationModulesPlugin {
    /**
     * @param {Compilation} compilation the compilation
     * @returns {CompilationHooks} the attached hooks
     */
    static getCompilationHooks(compilation) {
        // Avoid cross-realm instanceof checks (e.g., Jest VM modules) by using
        // a duck-typed verification of a Webpack Compilation-like object.
        const isLikelyCompilation = compilation &&
            typeof compilation === 'object' &&
            // @ts-ignore
            typeof compilation.hooks === 'object' &&
            // A couple of well-known hooks available on Webpack 5 compilations
            // @ts-ignore
            typeof compilation.hooks.processAssets?.tap === 'function';
        if (!isLikelyCompilation) {
            throw new TypeError("Invalid 'compilation' argument: expected a Webpack Compilation-like object");
        }
        let hooks = compilationHooksMap.get(compilation);
        if (hooks === undefined) {
            hooks = {
                addContainerEntryDependency: new tapable_1.SyncHook(['dependency']),
                addFederationRuntimeDependency: new tapable_1.SyncHook(['dependency']),
                addRemoteDependency: new tapable_1.SyncHook(['dependency']),
            };
            compilationHooksMap.set(compilation, hooks);
        }
        return hooks;
    }
    constructor(options = {}) {
        this.options = options;
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
            //@ts-ignore
            const hooks = FederationModulesPlugin.getCompilationHooks(compilation);
        });
    }
}
exports.default = FederationModulesPlugin;
//# sourceMappingURL=FederationModulesPlugin.js.map