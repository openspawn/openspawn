import type { ModuleFederationRuntimePlugin } from '@module-federation/runtime';
export declare const nodeRuntimeImportCache: Map<string, Promise<any>>;
export declare function importNodeModule<T>(name: string): Promise<T>;
export declare const resolveFile: (rootOutputDir: string, chunkId: string) => string;
export declare const returnFromCache: (remoteName: string) => string | null;
export declare const returnFromGlobalInstances: (remoteName: string) => string | null;
export declare const loadFromFs: (filename: string, callback: (err: Error | null, chunk: any) => void) => void;
export declare const fetchAndRun: (url: URL, chunkName: string, callback: (err: Error | null, chunk: any) => void, args: any) => void;
export declare const resolveUrl: (remoteName: string, chunkName: string) => URL | null;
export declare const loadChunk: (strategy: string, chunkId: string, rootOutputDir: string, callback: (err: Error | null, chunk: any) => void, args: any) => void;
export declare const installChunk: (chunk: any, installedChunks: {
    [key: string]: any;
}) => void;
export declare const deleteChunk: (chunkId: string, installedChunks: {
    [key: string]: any;
}) => boolean;
export declare const setupScriptLoader: () => void;
export declare const setupChunkHandler: (installedChunks: {
    [key: string]: any;
}, args: any) => ((chunkId: string, promises: any[]) => void);
export declare const setupWebpackRequirePatching: (handle: (chunkId: string, promises: any[]) => void) => void;
export default function (): ModuleFederationRuntimePlugin;
