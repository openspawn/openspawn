import { ChildProcess } from 'child_process';
import { D as DTSManagerOptions } from './DTSManagerOptions-QVchWb0x.js';
import { D as DTSManager } from './DTSManager-b15Gfat3.js';

declare enum RpcGMCallTypes {
    CALL = "mf_call",
    RESOLVE = "mf_resolve",
    REJECT = "mf_reject",
    EXIT = "mf_exit"
}
interface RpcCallMessage {
    type: RpcGMCallTypes.CALL;
    id: string;
    args: unknown[];
}
interface RpcResolveMessage {
    type: RpcGMCallTypes.RESOLVE;
    id: string;
    value: unknown;
}
interface RpcRejectMessage {
    type: RpcGMCallTypes.REJECT;
    id: string;
    error: unknown;
}
interface RpcExitMessage {
    type: RpcGMCallTypes.EXIT;
    id: string;
}
type RpcMessage = RpcCallMessage | RpcResolveMessage | RpcRejectMessage | RpcExitMessage;
type RpcMethod = (...args: any[]) => any;
type RpcRemoteMethod<T extends RpcMethod> = T extends (...args: infer A) => infer R ? R extends Promise<any> ? (...args: A) => R : (...args: A) => Promise<R> : (...args: unknown[]) => Promise<unknown>;

interface RpcWorkerBase {
    connect(...args: unknown[]): any;
    terminate(): void;
    readonly connected: boolean;
    readonly id: string;
    readonly process: ChildProcess | undefined;
}
type RpcWorker<T extends RpcMethod = RpcMethod> = RpcWorkerBase & RpcRemoteMethod<T>;
declare function createRpcWorker<T extends RpcMethod>(modulePath: string, data: unknown, memoryLimit?: number, once?: boolean): RpcWorker<T>;
declare function getRpcWorkerData(): unknown;

type DtsWorkerOptions = DTSManagerOptions;
declare class DtsWorker {
    rpcWorker: RpcWorker<RpcMethod>;
    private _options;
    private _res;
    constructor(options: DtsWorkerOptions);
    removeUnSerializationOptions(): void;
    get controlledPromise(): ReturnType<DTSManager['generateTypes']>;
    exit(): void;
}

export { DtsWorker as D, type RpcRemoteMethod as R, type RpcCallMessage as a, RpcGMCallTypes as b, type RpcMessage as c, type RpcMethod as d, type RpcRejectMessage as e, type RpcResolveMessage as f, type RpcWorker as g, createRpcWorker as h, getRpcWorkerData as i, type DtsWorkerOptions as j };
