import { a as RemoteOptions, D as DTSManagerOptions, R as RemoteInfo, H as HostOptions } from './DTSManagerOptions-QVchWb0x.js';
import ts from 'typescript';

interface TsConfigJson {
    extends?: string;
    compilerOptions?: ts.CompilerOptions;
    exclude?: string[];
    include?: string[];
    files?: string[];
}

declare const retrieveRemoteConfig: (options: RemoteOptions) => {
    tsConfig: TsConfigJson;
    mapComponentsToExpose: Record<string, string>;
    remoteOptions: Required<RemoteOptions>;
};

declare const enum UpdateMode {
    POSITIVE = "POSITIVE",
    PASSIVE = "PASSIVE"
}

interface UpdateTypesOptions {
    updateMode: UpdateMode;
    remoteName?: string;
    remoteTarPath?: string;
    remoteInfo?: RemoteInfo;
    once?: boolean;
}
declare class DTSManager {
    options: DTSManagerOptions;
    runtimePkgs: string[];
    remoteAliasMap: Record<string, Required<RemoteInfo>>;
    loadedRemoteAPIAlias: Set<string>;
    extraOptions: Record<string, any>;
    updatedRemoteInfos: Record<string, Required<RemoteInfo>>;
    constructor(options: DTSManagerOptions);
    generateAPITypes(mapComponentsToExpose: Record<string, string>): string;
    extractRemoteTypes(options: ReturnType<typeof retrieveRemoteConfig>): Promise<void>;
    generateTypes(): Promise<void>;
    requestRemoteManifest(remoteInfo: RemoteInfo, hostOptions: Required<HostOptions>): Promise<Required<RemoteInfo>>;
    consumeTargetRemotes(hostOptions: Required<HostOptions>, remoteInfo: Required<RemoteInfo>): Promise<[string, string]>;
    downloadAPITypes(remoteInfo: Required<RemoteInfo>, destinationPath: string, hostOptions: Required<HostOptions>): Promise<boolean>;
    consumeAPITypes(hostOptions: Required<HostOptions>): void;
    consumeArchiveTypes(options: HostOptions): Promise<{
        hostOptions: Required<HostOptions>;
        downloadPromisesResult: PromiseSettledResult<[string, string]>[];
    }>;
    consumeTypes(): Promise<void>;
    updateTypes(options: UpdateTypesOptions): Promise<void>;
}

export { DTSManager as D, type TsConfigJson as T, retrieveRemoteConfig as r };
