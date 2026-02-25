import { ModuleInfo } from '@module-federation/sdk';
import { ModuleFederation } from '../core';
import { RemoteEntryExports, RemoteInfo, ShareScopeMap } from '../type';
export type ModuleOptions = ConstructorParameters<typeof Module>[0];
export declare function createRemoteEntryInitOptions(remoteInfo: RemoteInfo, hostShareScopeMap: ShareScopeMap): Record<string, any>;
declare class Module {
    remoteInfo: RemoteInfo;
    inited: boolean;
    initing: boolean;
    remoteEntryExports?: RemoteEntryExports;
    lib: RemoteEntryExports | undefined;
    host: ModuleFederation;
    constructor({ remoteInfo, host, }: {
        remoteInfo: RemoteInfo;
        host: ModuleFederation;
    });
    getEntry(): Promise<RemoteEntryExports>;
    init(id?: string, remoteSnapshot?: ModuleInfo): Promise<RemoteEntryExports>;
    get(id: string, expose: string, options?: {
        loadFactory?: boolean;
    }, remoteSnapshot?: ModuleInfo): Promise<any>;
    private wraperFactory;
}
export { Module };
