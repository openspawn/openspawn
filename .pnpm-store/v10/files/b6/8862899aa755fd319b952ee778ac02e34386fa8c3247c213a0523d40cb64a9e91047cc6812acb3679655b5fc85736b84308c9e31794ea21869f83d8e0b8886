import { T as TsConfigJson } from './DTSManager-b15Gfat3.js';
export { D as DTSManager, r as retrieveRemoteConfig } from './DTSManager-b15Gfat3.js';
import { H as HostOptions, R as RemoteInfo, a as RemoteOptions, D as DTSManagerOptions } from './DTSManagerOptions-QVchWb0x.js';
export { g as getDTSManagerConstructor, i as isTSProject, r as retrieveTypesAssetsInfo, v as validateOptions } from './utils-DxGrqb9N.js';
import { R as RpcRemoteMethod, a as RpcCallMessage, b as RpcGMCallTypes, c as RpcMessage, d as RpcMethod, e as RpcRejectMessage, f as RpcResolveMessage, g as RpcWorker, h as createRpcWorker, i as getRpcWorkerData } from './DtsWorker-BrHsGz8C.js';
export { D as DtsWorker } from './DtsWorker-BrHsGz8C.js';
import { ChildProcess } from 'child_process';
import 'typescript';
import '@module-federation/sdk';

declare const retrieveHostConfig: (options: HostOptions) => {
    hostOptions: Required<HostOptions>;
    mapRemotesToDownload: Record<string, RemoteInfo>;
};

declare const retrieveMfTypesPath: (tsConfig: TsConfigJson, remoteOptions: Required<RemoteOptions>) => string;
declare const retrieveOriginalOutDir: (tsConfig: TsConfigJson, remoteOptions: Required<RemoteOptions>) => string;

declare const retrieveTypesZipPath: (mfTypesPath: string, remoteOptions: Required<RemoteOptions>) => string;

declare function generateTypes(options: DTSManagerOptions): Promise<void>;

declare function generateTypesInChildProcess(options: DTSManagerOptions): Promise<void>;

declare function exposeRpc(fn: (...args: any[]) => any): void;

interface WrapRpcOptions {
    id: string;
    once?: boolean;
}
declare function wrapRpc<T extends (...args: any[]) => any>(childProcess: ChildProcess, options: WrapRpcOptions): RpcRemoteMethod<T>;

declare class RpcExitError extends Error {
    readonly code?: string | number | null;
    readonly signal?: string | null;
    constructor(message: string, code?: string | number | null, signal?: string | null);
}

/**
 * forked from https://github.com/TypeStrong/fork-ts-checker-webpack-plugin
 * license at https://github.com/TypeStrong/fork-ts-checker-webpack-plugin/blob/main/LICENSE
 */

declare const index_RpcCallMessage: typeof RpcCallMessage;
type index_RpcExitError = RpcExitError;
declare const index_RpcExitError: typeof RpcExitError;
declare const index_RpcGMCallTypes: typeof RpcGMCallTypes;
declare const index_RpcMessage: typeof RpcMessage;
declare const index_RpcMethod: typeof RpcMethod;
declare const index_RpcRejectMessage: typeof RpcRejectMessage;
declare const index_RpcRemoteMethod: typeof RpcRemoteMethod;
declare const index_RpcResolveMessage: typeof RpcResolveMessage;
declare const index_RpcWorker: typeof RpcWorker;
declare const index_createRpcWorker: typeof createRpcWorker;
declare const index_exposeRpc: typeof exposeRpc;
declare const index_getRpcWorkerData: typeof getRpcWorkerData;
declare const index_wrapRpc: typeof wrapRpc;
declare namespace index {
  export { index_RpcCallMessage as RpcCallMessage, index_RpcExitError as RpcExitError, index_RpcGMCallTypes as RpcGMCallTypes, index_RpcMessage as RpcMessage, index_RpcMethod as RpcMethod, index_RpcRejectMessage as RpcRejectMessage, index_RpcRemoteMethod as RpcRemoteMethod, index_RpcResolveMessage as RpcResolveMessage, index_RpcWorker as RpcWorker, index_createRpcWorker as createRpcWorker, index_exposeRpc as exposeRpc, index_getRpcWorkerData as getRpcWorkerData, index_wrapRpc as wrapRpc };
}

declare function consumeTypes(options: DTSManagerOptions): Promise<void>;

declare const REMOTE_ALIAS_IDENTIFIER = "REMOTE_ALIAS_IDENTIFIER";
declare const REMOTE_API_TYPES_FILE_NAME = "apis.d.ts";
declare const HOST_API_TYPES_FILE_NAME = "index.d.ts";

export { DTSManagerOptions, HOST_API_TYPES_FILE_NAME, HostOptions, REMOTE_ALIAS_IDENTIFIER, REMOTE_API_TYPES_FILE_NAME, RemoteOptions, consumeTypes, generateTypes, generateTypesInChildProcess, retrieveHostConfig, retrieveMfTypesPath, retrieveOriginalOutDir, retrieveTypesZipPath, index as rpc };
