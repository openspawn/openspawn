import type { Compiler, Chunk, Module } from 'webpack';
export interface Options {
    eager?: RegExp | ((module: Module) => boolean);
    excludeChunk?: (chunk: Chunk) => boolean;
}
declare class EntryChunkTrackerPlugin {
    private _options;
    constructor(options?: Options);
    apply(compiler: Compiler): void;
    private _handleRenderStartup;
    private _getTemplateString;
}
export default EntryChunkTrackerPlugin;
