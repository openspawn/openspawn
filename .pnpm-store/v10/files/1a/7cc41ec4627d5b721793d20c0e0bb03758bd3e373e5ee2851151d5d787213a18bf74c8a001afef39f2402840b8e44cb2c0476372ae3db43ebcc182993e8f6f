import type { Compiler } from 'webpack';
type PluginOptions = {
    skipInitialBuild?: boolean;
    skipWatchingDeps?: boolean;
};
export declare class WebpackNxBuildCoordinationPlugin {
    private readonly buildCmd;
    private currentlyRunning;
    private buildCmdProcess;
    constructor(buildCmd: string);
    /**
     * @deprecated Use the constructor with the `options` parameter instead.
     */
    constructor(buildCmd: string, skipInitialBuild?: boolean);
    constructor(buildCmd: string, options?: PluginOptions);
    apply(compiler: Compiler): void;
    startWatchingBuildableLibs(): Promise<void>;
    buildChangedProjects(): Promise<void>;
    private createFileWatcher;
}
export {};
//# sourceMappingURL=webpack-nx-build-coordination-plugin.d.ts.map