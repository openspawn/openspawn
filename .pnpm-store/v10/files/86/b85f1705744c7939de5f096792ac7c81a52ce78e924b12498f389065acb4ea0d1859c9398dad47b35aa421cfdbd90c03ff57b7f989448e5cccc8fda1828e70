import type { WebpackPluginInstance, Compiler } from 'webpack';
import { moduleFederationPlugin } from '@module-federation/sdk';
import { ReferencedExports } from './SharedUsedExportsOptimizerRuntimeModule';
import { NormalizedSharedOptions } from '../SharePlugin';
export type CustomReferencedExports = {
    [sharedName: string]: string[];
};
export default class SharedUsedExportsOptimizerPlugin implements WebpackPluginInstance {
    name: string;
    sharedReferencedExports: ReferencedExports;
    private sharedOptions;
    private injectTreeShakingUsedExports;
    private manifestOptions;
    ignoredRuntime: string[];
    constructor(sharedOptions: NormalizedSharedOptions, injectTreeShakingUsedExports?: boolean, ignoredRuntime?: string[], manifestOptions?: moduleFederationPlugin.ModuleFederationPluginOptions['manifest']);
    private applyCustomReferencedExports;
    apply(compiler: Compiler): void;
}
