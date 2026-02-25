"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const SortableSet = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/SortableSet'));
class EntryChunkTrackerPlugin {
    constructor(options) {
        this._options = options || {};
    }
    apply(compiler) {
        compiler.hooks.thisCompilation.tap('EntryChunkTrackerPlugin', (compilation) => {
            this._handleRenderStartup(compiler, compilation);
        });
    }
    _handleRenderStartup(compiler, compilation) {
        compiler.webpack.javascript.JavascriptModulesPlugin.getCompilationHooks(compilation).renderStartup.tap('EntryChunkTrackerPlugin', (source, _renderContext, upperContext) => {
            if (this._options.excludeChunk &&
                this._options.excludeChunk(upperContext.chunk)) {
                return source;
            }
            const templateString = this._getTemplateString(compiler, source);
            return new compiler.webpack.sources.ConcatSource(templateString);
        });
    }
    _getTemplateString(compiler, source) {
        const { Template } = compiler.webpack;
        return Template.asString([
            `if(typeof module !== 'undefined') {
        globalThis.entryChunkCache = globalThis.entryChunkCache || new Set();
        module.filename && globalThis.entryChunkCache.add(module.filename);
        if(module.children) {
        module.children.forEach(function(c) {
          c.filename && globalThis.entryChunkCache.add(c.filename);
        })
}
      }`,
            Template.indent(source.source().toString()),
        ]);
    }
}
exports.default = EntryChunkTrackerPlugin;
//# sourceMappingURL=EntryChunkTrackerPlugin.js.map