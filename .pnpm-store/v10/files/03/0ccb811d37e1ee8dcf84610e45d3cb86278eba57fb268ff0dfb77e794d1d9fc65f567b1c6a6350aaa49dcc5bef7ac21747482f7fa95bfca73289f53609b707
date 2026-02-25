import type { Compiler, RspackPluginInstance } from '@rspack/core';
import { moduleFederationPlugin } from '@module-federation/sdk';
import { RemoteEntryPlugin } from './RemoteEntryPlugin';
export declare const PLUGIN_NAME = "RspackModuleFederationPlugin";
export declare class ModuleFederationPlugin implements RspackPluginInstance {
    readonly name = "RspackModuleFederationPlugin";
    private _options;
    private _statsPlugin?;
    constructor(options: moduleFederationPlugin.ModuleFederationPluginOptions);
    private _patchBundlerConfig;
    private _checkSingleton;
    apply(compiler: Compiler): void;
    private _patchChunkSplit;
}
export declare const GetPublicPathPlugin: typeof RemoteEntryPlugin;
