import type { Compiler } from 'webpack';
import type { sharePlugin, moduleFederationPlugin } from '@module-federation/sdk';
import type { SharedConfig } from '../../declarations/plugins/sharing/SharePlugin';
export type NormalizedSharedOptions = [string, SharedConfig][];
export declare function normalizeSharedOptions(shared: moduleFederationPlugin.Shared): NormalizedSharedOptions;
export declare function createConsumeShareOptions(normalizedSharedOptions: NormalizedSharedOptions): {
    [x: string]: {
        import: string | false | undefined;
        shareKey: string;
        shareScope: string | string[] | undefined;
        requiredVersion: string | false | undefined;
        strictVersion: boolean | undefined;
        singleton: boolean | undefined;
        packageName: string | undefined;
        eager: boolean | undefined;
        issuerLayer: string | undefined;
        layer: string | undefined;
        request: string;
        exclude: import("../../declarations/plugins/sharing/SharePlugin").IncludeExcludeOptions | undefined;
        include: import("../../declarations/plugins/sharing/SharePlugin").IncludeExcludeOptions | undefined;
        allowNodeModulesSuffixMatch: boolean | undefined;
        treeShakingMode: "server-calc" | "runtime-infer" | undefined;
    };
}[];
export declare function createProvideShareOptions(normalizedSharedOptions: NormalizedSharedOptions): {
    [x: string]: {
        shareKey: string;
        shareScope: string | string[] | undefined;
        version: string | false | undefined;
        eager: boolean | undefined;
        requiredVersion: string | false | undefined;
        strictVersion: boolean | undefined;
        singleton: boolean | undefined;
        layer: string | undefined;
        request: string;
        exclude: import("../../declarations/plugins/sharing/SharePlugin").IncludeExcludeOptions | undefined;
        include: import("../../declarations/plugins/sharing/SharePlugin").IncludeExcludeOptions | undefined;
        allowNodeModulesSuffixMatch: boolean | undefined;
        treeShakingMode: "server-calc" | "runtime-infer" | undefined;
    };
}[];
declare class SharePlugin {
    private _shareScope;
    private _consumes;
    private _provides;
    constructor(options: sharePlugin.SharePluginOptions);
    /**
     * Applies the plugin to the webpack compiler instance
     * @param compiler - The webpack compiler instance
     */
    apply(compiler: Compiler): void;
}
export default SharePlugin;
