"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RemotePublicPathRuntimeModule_1 = __importDefault(require("./RemotePublicPathRuntimeModule"));
class RemotePublicPathPlugin {
    constructor(options) {
        this.options = options;
    }
    apply(compiler) {
        const { RuntimeGlobals } = compiler.webpack;
        compiler.hooks.thisCompilation.tap('RemotePublicPathPlugin', (compilation) => {
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
        });
    }
}
exports.default = RemotePublicPathPlugin;
//# sourceMappingURL=AutomaticPublicPathPlugin.js.map