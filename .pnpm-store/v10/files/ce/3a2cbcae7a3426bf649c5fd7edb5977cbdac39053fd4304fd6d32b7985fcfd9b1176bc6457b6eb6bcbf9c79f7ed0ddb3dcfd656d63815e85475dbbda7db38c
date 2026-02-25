import { Federation } from '../global';
import { GlobalShareScopeMap, Shared, ShareInfos, ShareScopeMap, LoadShareExtraOptions, UserOptions, Options, TreeShakingArgs } from '../type';
import { SyncWaterfallHook } from './hooks';
export declare function formatShareConfigs(prevOptions: Options, newOptions: UserOptions): {
    allShareInfos: {
        [pkgName: string]: Shared[];
    };
    newShareInfos: ShareInfos;
};
export declare function shouldUseTreeShaking(treeShaking?: TreeShakingArgs, usedExports?: string[]): boolean;
/**
 * compare version a and b, return true if a is less than b
 */
export declare function versionLt(a: string, b: string): boolean;
export declare const findVersion: (shareVersionMap: ShareScopeMap[string][string], cb?: (prev: string, cur: string) => boolean) => string;
export declare const isLoaded: (shared: {
    loading?: null | Promise<any>;
    loaded?: boolean;
    lib?: () => unknown;
}) => boolean;
export declare function getRegisteredShare(localShareScopeMap: ShareScopeMap, pkgName: string, shareInfo: Shared, resolveShare: SyncWaterfallHook<{
    shareScopeMap: ShareScopeMap;
    scope: string;
    pkgName: string;
    version: string;
    shareInfo: Shared;
    GlobalFederation: Federation;
    resolver: () => {
        shared: Shared;
        useTreesShaking: boolean;
    } | undefined;
}>): {
    shared: Shared;
    useTreesShaking: boolean;
} | void;
export declare function getGlobalShareScope(): GlobalShareScopeMap;
export declare function getTargetSharedOptions(options: {
    pkgName: string;
    extraOptions?: LoadShareExtraOptions;
    shareInfos: ShareInfos;
}): Shared;
export declare const addUseIn: (shared: {
    useIn?: Array<string>;
}, from: string) => void;
export declare function directShare(shared: Shared, useTreesShaking?: boolean): Shared | TreeShakingArgs;
