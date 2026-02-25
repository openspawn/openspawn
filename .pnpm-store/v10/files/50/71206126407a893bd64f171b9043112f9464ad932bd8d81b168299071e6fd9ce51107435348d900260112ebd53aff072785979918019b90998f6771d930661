"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsJsonPlugin = void 0;
const webpack_1 = require("webpack");
class StatsJsonPlugin {
    apply(compiler) {
        compiler.hooks.emit.tap('StatsJsonPlugin', (compilation) => {
            const data = JSON.stringify(compilation.getStats().toJson('verbose'));
            compilation.assets[`stats.json`] = new webpack_1.sources.RawSource(data);
        });
    }
}
exports.StatsJsonPlugin = StatsJsonPlugin;
