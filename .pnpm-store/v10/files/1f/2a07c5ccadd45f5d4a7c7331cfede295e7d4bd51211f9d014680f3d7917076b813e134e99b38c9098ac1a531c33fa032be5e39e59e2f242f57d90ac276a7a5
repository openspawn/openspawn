import { ExecutorContext } from '@nx/devkit';
import { Configuration } from 'webpack';
import { NormalizedWebpackExecutorOptions } from '../executors/webpack/schema';
export declare const nxWebpackComposablePlugin = "nxWebpackComposablePlugin";
export declare function isNxWebpackComposablePlugin(a: unknown): a is AsyncNxComposableWebpackPlugin;
export interface NxWebpackExecutionContext {
    options: NormalizedWebpackExecutorOptions;
    context: ExecutorContext;
    configuration?: string;
}
export interface NxComposableWebpackPlugin {
    (config: Configuration, ctx: NxWebpackExecutionContext): Configuration;
}
export interface AsyncNxComposableWebpackPlugin {
    (config: Configuration, ctx: NxWebpackExecutionContext): Configuration | Promise<Configuration>;
}
export declare function composePlugins(...plugins: (NxComposableWebpackPlugin | AsyncNxComposableWebpackPlugin | Promise<NxComposableWebpackPlugin | AsyncNxComposableWebpackPlugin>)[]): ((config: Configuration, ctx: NxWebpackExecutionContext) => Promise<Configuration>) & {
    nxWebpackComposablePlugin: boolean;
};
export declare function composePluginsSync(...plugins: NxComposableWebpackPlugin[]): ((config: Configuration, ctx: NxWebpackExecutionContext) => Configuration) & {
    nxWebpackComposablePlugin: boolean;
};
//# sourceMappingURL=config.d.ts.map