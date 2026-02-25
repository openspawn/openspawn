import type { Compiler } from 'webpack';
import type { moduleFederationPlugin } from '@module-federation/sdk';
export interface TreeShakingSharePluginOptions {
    mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions;
    secondary?: boolean;
}
export default class TreeShakingSharedPlugin {
    mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions;
    outputDir: string;
    secondary?: boolean;
    private _independentSharePlugin?;
    name: string;
    constructor(options: TreeShakingSharePluginOptions);
    apply(compiler: Compiler): void;
}
