import * as webpack from 'webpack';
export interface ScriptsWebpackPluginOptions {
    name: string;
    sourceMap: boolean;
    scripts: string[];
    filename: string;
    basePath: string;
}
export declare class ScriptsWebpackPlugin {
    private options;
    private _lastBuildTime?;
    private _cachedOutput?;
    constructor(options?: Partial<ScriptsWebpackPluginOptions>);
    shouldSkip(compilation: any, scripts: string[]): boolean;
    private _insertOutput;
    apply(compiler: webpack.Compiler): void;
}
//# sourceMappingURL=scripts-webpack-plugin.d.ts.map