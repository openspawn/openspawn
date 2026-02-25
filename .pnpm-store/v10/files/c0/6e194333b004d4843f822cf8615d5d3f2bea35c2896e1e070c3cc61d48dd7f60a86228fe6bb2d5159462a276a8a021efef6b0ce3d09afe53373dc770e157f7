"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SharedUsedExportsOptimizerPlugin_1 = __importDefault(require("./SharedUsedExportsOptimizerPlugin"));
const IndependentSharedPlugin_1 = __importDefault(require("./IndependentSharedPlugin"));
const SharePlugin_1 = require("../SharePlugin");
class TreeShakingSharedPlugin {
    constructor(options) {
        this.name = 'TreeShakingSharedPlugin';
        const { mfConfig, secondary } = options;
        this.mfConfig = mfConfig;
        this.outputDir = mfConfig.treeShakingDir || 'independent-packages';
        this.secondary = Boolean(secondary);
    }
    apply(compiler) {
        const { mfConfig, outputDir, secondary } = this;
        const { name, shared, library } = mfConfig;
        if (!name) {
            throw new Error('name is required');
        }
        if (!shared) {
            return;
        }
        const sharedOptions = (0, SharePlugin_1.normalizeSharedOptions)(shared);
        if (!sharedOptions.length) {
            return;
        }
        if (sharedOptions.some(([_, config]) => config.treeShaking && config.import !== false)) {
            if (!secondary) {
                new SharedUsedExportsOptimizerPlugin_1.default(sharedOptions, mfConfig.injectTreeShakingUsedExports, undefined, mfConfig.manifest).apply(compiler);
            }
            this._independentSharePlugin = new IndependentSharedPlugin_1.default({
                name: name,
                shared: shared,
                outputDir,
                plugins: mfConfig.treeShakingSharedPlugins?.map((p) => {
                    const _constructor = require(p);
                    return new _constructor();
                }) || [],
                treeShakingSharedExcludePlugins: mfConfig.treeShakingSharedExcludePlugins,
                treeShaking: secondary,
                library,
                manifest: mfConfig.manifest,
            });
            this._independentSharePlugin.apply(compiler);
        }
    }
}
exports.default = TreeShakingSharedPlugin;
//# sourceMappingURL=TreeShakingSharedPlugin.js.map