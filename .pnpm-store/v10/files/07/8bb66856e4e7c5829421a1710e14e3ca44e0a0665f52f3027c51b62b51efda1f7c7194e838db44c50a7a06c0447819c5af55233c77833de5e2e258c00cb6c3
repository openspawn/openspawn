import type { WebpackPluginInstance, Compiler } from 'webpack';
import { type moduleFederationPlugin } from '@module-federation/sdk';
export declare const PLUGIN_NAME = "ModuleFederationPlugin";
export default class ModuleFederationPlugin implements WebpackPluginInstance {
    private _options;
    private _mfPlugin?;
    name: string;
    constructor(options: moduleFederationPlugin.ModuleFederationPluginOptions);
    apply(compiler: Compiler): void;
}
