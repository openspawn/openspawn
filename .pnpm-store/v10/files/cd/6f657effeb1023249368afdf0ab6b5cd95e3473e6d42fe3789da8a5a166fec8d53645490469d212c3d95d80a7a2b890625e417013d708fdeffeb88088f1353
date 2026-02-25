"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const btoa_1 = __importDefault(require("btoa"));
class UniverseEntryChunkTrackerPlugin {
    apply(compiler) {
        const code = `
    if(typeof module !== 'undefined') {
    globalThis.entryChunkCache = globalThis.entryChunkCache || new Set();
    module.filename && globalThis.entryChunkCache.add(module.filename);
    if(module.children) {
    module.children.forEach(function(c) {
      c.filename && globalThis.entryChunkCache.add(c.filename);
    })
}
  }
    `;
        const base64Code = (0, btoa_1.default)(code);
        const dataUrl = `data:text/javascript;base64,${base64Code}`;
        compiler.hooks.afterPlugins.tap('UniverseEntryChunkTrackerPlugin', () => {
            new compiler.webpack.EntryPlugin(compiler.context, dataUrl, {}).apply(compiler);
        });
    }
}
exports.default = UniverseEntryChunkTrackerPlugin;
//# sourceMappingURL=UniverseEntryChunkTrackerPlugin.js.map