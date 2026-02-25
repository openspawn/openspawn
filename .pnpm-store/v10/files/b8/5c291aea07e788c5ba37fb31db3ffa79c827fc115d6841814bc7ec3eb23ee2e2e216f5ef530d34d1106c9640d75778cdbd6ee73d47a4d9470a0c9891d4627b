"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const utils_1 = require("../../container/runtime/utils");
const { Template, RuntimeGlobals, RuntimeModule } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
class SharedUsedExportsOptimizerRuntimeModule extends RuntimeModule {
    constructor(sharedUsedExports) {
        super('shared-used-exports', RuntimeModule.STAGE_ATTACH);
        this.sharedUsedExports = sharedUsedExports;
    }
    /**
     * @returns {string | null} runtime code
     */
    generate() {
        if (!this.sharedUsedExports) {
            return null;
        }
        const federationGlobal = (0, utils_1.getFederationGlobalScope)(RuntimeGlobals);
        return Template.asString([
            `if(!${federationGlobal}) {return;}`,
            `${federationGlobal}.usedExports = ${JSON.stringify(Array.from(this.sharedUsedExports.entries()).reduce((acc, [pkg, moduleMap]) => {
                acc[pkg] = Array.from(moduleMap);
                return acc;
            }, {}))};`,
        ]);
    }
}
exports.default = SharedUsedExportsOptimizerRuntimeModule;
//# sourceMappingURL=SharedUsedExportsOptimizerRuntimeModule.js.map