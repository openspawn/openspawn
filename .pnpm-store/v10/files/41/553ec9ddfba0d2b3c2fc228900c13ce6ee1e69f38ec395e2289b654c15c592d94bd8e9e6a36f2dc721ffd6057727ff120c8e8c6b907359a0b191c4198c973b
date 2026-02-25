import type { WebpackPluginInstance, Compiler } from 'webpack';
import type { moduleFederationPlugin } from '@module-federation/sdk';
import { NormalizedSharedOptions } from '../SharePlugin';
export type ShareFallback = Record<string, [string, string, string][]>;
export type MakeRequired<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
export interface IndependentSharePluginOptions {
    name: string;
    shared: moduleFederationPlugin.Shared;
    library?: moduleFederationPlugin.LibraryOptions;
    outputDir?: string;
    plugins?: WebpackPluginInstance[];
    treeShaking?: boolean;
    manifest?: moduleFederationPlugin.ModuleFederationPluginOptions['manifest'];
    injectTreeShakingUsedExports?: boolean;
    treeShakingSharedExcludePlugins?: string[];
}
export default class IndependentSharedPlugin {
    mfName: string;
    shared: moduleFederationPlugin.Shared;
    library?: moduleFederationPlugin.LibraryOptions;
    sharedOptions: NormalizedSharedOptions;
    outputDir: string;
    plugins: WebpackPluginInstance[];
    treeShaking?: boolean;
    manifest?: moduleFederationPlugin.ModuleFederationPluginOptions['manifest'];
    injectTreeShakingUsedExports?: boolean;
    buildAssets: ShareFallback;
    treeShakingSharedExcludePlugins?: string[];
    name: string;
    constructor(options: IndependentSharePluginOptions);
    static IndependentShareBuildAssetsFilename: string;
    apply(compiler: Compiler): void;
    private createEntry;
    private createIndependentCompilers;
    private createIndependentCompiler;
}
