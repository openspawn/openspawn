"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const SharedEntryModule_1 = __importDefault(require("./SharedEntryModule"));
const ModuleFactory = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/ModuleFactory'));
class SharedEntryModuleFactory extends ModuleFactory {
    /**
     * @param {ModuleFactoryCreateData} data data object
     * @param {function((Error | null)=, ModuleFactoryResult=): void} callback callback
     * @returns {void}
     */
    // @ts-ignore
    create(data, callback) {
        const { dependencies } = data;
        const containerDependencies = dependencies;
        const dep = containerDependencies[0];
        callback(null, {
            // @ts-ignore
            module: new SharedEntryModule_1.default(dep.name, dep.request),
        });
    }
}
exports.default = SharedEntryModuleFactory;
//# sourceMappingURL=SharedEntryModuleFactory.js.map