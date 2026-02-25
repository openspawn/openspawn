import type { Compiler } from 'webpack';
import { NormalizedSharedOptions } from '../SharePlugin';
export type ShareRequestsMap = Record<string, {
    requests: [string, string][];
}>;
export type CollectSharedEntryPluginOptions = {
    sharedOptions: NormalizedSharedOptions;
    shareScope?: string;
};
declare class CollectSharedEntryPlugin {
    name: string;
    sharedOptions: NormalizedSharedOptions;
    private _collectedEntries;
    constructor(options: CollectSharedEntryPluginOptions);
    getData(): ShareRequestsMap;
    apply(compiler: Compiler): void;
}
export default CollectSharedEntryPlugin;
