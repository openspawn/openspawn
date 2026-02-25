declare global {
    var mfHashMap: Record<string, string> | undefined;
    var moduleGraphDirty: boolean;
}
export declare const performReload: (shouldReload: boolean) => Promise<boolean>;
export declare const checkUnreachableRemote: (remoteScope: any) => boolean;
export declare const checkMedusaConfigChange: (remoteScope: any, fetchModule: any) => boolean;
export declare const checkFakeRemote: (remoteScope: any) => boolean;
export declare const createFetcher: (url: string, fetchModule: any, name: string, cb: (hash: string) => void) => Promise<void | boolean>;
export declare const fetchRemote: (remoteScope: any, fetchModule: any) => Promise<boolean>;
export declare const revalidate: (fetchModule?: any, force?: boolean) => Promise<boolean>;
export declare function getFetchModule(): any;
