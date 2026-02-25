import { moduleFederationPlugin, sharePlugin } from '@module-federation/sdk';
import { NormalizedSharedOptions } from './types';
import { BasicPluginOptionsManager } from './BasicPluginOptionsManager';
type SharePluginOptions = ConstructorParameters<typeof sharePlugin.SharePlugin>[0];
declare class SharedManager extends BasicPluginOptionsManager<moduleFederationPlugin.ModuleFederationPluginOptions> {
    normalizedOptions: NormalizedSharedOptions;
    get enable(): boolean;
    get sharedPluginOptions(): SharePluginOptions;
    findPkg(name: string, shareConfig: moduleFederationPlugin.SharedConfig): {
        pkg: Record<string, any>;
        path: string;
        pkgPath: string;
    };
    get enableTreeShaking(): boolean;
    transformSharedConfig(sharedConfig: moduleFederationPlugin.SharedConfig): moduleFederationPlugin.SharedConfig;
    normalizeOptions(options: moduleFederationPlugin.ModuleFederationPluginOptions['shared']): void;
    init(options: moduleFederationPlugin.ModuleFederationPluginOptions): void;
}
export { SharedManager };
