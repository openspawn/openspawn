"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptsWebpackPlugin = void 0;
const loader_utils_1 = require("loader-utils");
const path = require("path");
const webpack = require("webpack");
const Chunk = require('webpack/lib/Chunk');
const EntryPoint = require('webpack/lib/Entrypoint');
function addDependencies(compilation, scripts) {
    for (const script of scripts) {
        compilation.fileDependencies.add(script);
    }
}
function hook(compiler, action) {
    compiler.hooks.thisCompilation.tap('scripts-webpack-plugin', (compilation) => {
        compilation.hooks.additionalAssets.tapAsync('scripts-webpack-plugin', (callback) => action(compilation, callback));
    });
}
class ScriptsWebpackPlugin {
    constructor(options = {}) {
        this.options = options;
    }
    shouldSkip(compilation, scripts) {
        if (this._lastBuildTime == undefined) {
            this._lastBuildTime = Date.now();
            return false;
        }
        for (let i = 0; i < scripts.length; i++) {
            const scriptTime = compilation.fileTimestamps?.get(scripts[i]);
            if (!scriptTime || scriptTime > this._lastBuildTime) {
                this._lastBuildTime = Date.now();
                return false;
            }
        }
        return true;
    }
    _insertOutput(compilation, { filename, source }, cached = false) {
        const chunk = new Chunk(this.options.name);
        chunk.rendered = !cached;
        chunk.id = this.options.name;
        chunk.ids = [chunk.id];
        if (chunk.files instanceof Set) {
            chunk.files.add(filename);
        }
        else if (chunk.files instanceof Array) {
            chunk.files.push(filename);
        }
        const entrypoint = new EntryPoint(this.options.name);
        entrypoint.pushChunk(chunk);
        chunk.addGroup(entrypoint);
        compilation.entrypoints.set(this.options.name, entrypoint);
        if (compilation.chunks instanceof Set) {
            compilation.chunks.add(chunk);
        }
        else if (compilation.chunks instanceof Array) {
            compilation.chunks.push(chunk);
        }
        compilation.assets[filename] = source;
    }
    apply(compiler) {
        if (!this.options.scripts || this.options.scripts.length === 0) {
            return;
        }
        const scripts = this.options.scripts
            .filter((script) => !!script)
            .map((script) => path.resolve(this.options.basePath || '', script));
        hook(compiler, (compilation, callback) => {
            if (this.shouldSkip(compilation, scripts)) {
                if (this._cachedOutput) {
                    this._insertOutput(compilation, this._cachedOutput, true);
                }
                addDependencies(compilation, scripts);
                callback();
                return;
            }
            const sourceGetters = scripts.map((fullPath) => {
                return new Promise((resolve, reject) => {
                    compilation.inputFileSystem.readFile(fullPath, (err, data) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        const content = data.toString();
                        let source;
                        if (this.options.sourceMap) {
                            // TODO: Look for source map file (for '.min' scripts, etc.)
                            let adjustedPath = fullPath;
                            if (this.options.basePath) {
                                adjustedPath = path.relative(this.options.basePath, fullPath);
                            }
                            source = new webpack.sources.OriginalSource(content, adjustedPath);
                        }
                        else {
                            source = new webpack.sources.RawSource(content);
                        }
                        resolve(source);
                    });
                });
            });
            Promise.all(sourceGetters)
                .then((sources) => {
                const concatSource = new webpack.sources.ConcatSource();
                sources.forEach((source) => {
                    concatSource.add(source);
                    concatSource.add('\n;');
                });
                const combinedSource = new webpack.sources.CachedSource(concatSource);
                const filename = (0, loader_utils_1.interpolateName)({ resourcePath: 'scripts.js' }, this.options.filename, { content: combinedSource.source() });
                const output = { filename, source: combinedSource };
                this._insertOutput(compilation, output);
                this._cachedOutput = output;
                addDependencies(compilation, scripts);
                callback();
            })
                .catch((err) => callback(err));
        });
    }
}
exports.ScriptsWebpackPlugin = ScriptsWebpackPlugin;
