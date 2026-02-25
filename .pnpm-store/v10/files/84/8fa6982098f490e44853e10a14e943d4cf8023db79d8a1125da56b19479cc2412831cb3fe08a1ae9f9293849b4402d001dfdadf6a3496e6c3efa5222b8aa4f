"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const utils_1 = require("../../container/runtime/utils");
const { Template, RuntimeGlobals, RuntimeModule } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
class IndependentSharedRuntimeModule extends RuntimeModule {
    constructor(buildAssets, libraryType) {
        super('shared-fallback', RuntimeModule.STAGE_ATTACH);
        this.buildAssets = {};
        this.libraryType = 'global';
        this.buildAssets = buildAssets;
        this.libraryType = libraryType;
    }
    /**
     * @returns {string | null} runtime code
     */
    generate() {
        if (!this.buildAssets || !Object.keys(this.buildAssets).length) {
            return null;
        }
        const federationGlobal = (0, utils_1.getFederationGlobalScope)(RuntimeGlobals);
        return Template.asString([
            `if (!${federationGlobal}) return;`,
            `${federationGlobal}.sharedFallback = ${JSON.stringify(this.buildAssets)};`,
            `${federationGlobal}.libraryType = ${JSON.stringify(this.libraryType)};`,
        ]);
    }
}
exports.default = IndependentSharedRuntimeModule;
//# sourceMappingURL=IndependentSharedRuntimeModule.js.map