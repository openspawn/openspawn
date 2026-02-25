export declare function fileSystemRunInContextStrategy(chunkId: string, rootOutputDir: string, remotes: Remotes, callback: CallbackFunction): Promise<void>;
export declare function httpEvalStrategy(chunkName: string, remoteName: string, remotes: Remotes, callback: CallbackFunction): Promise<void>;
interface Remotes {
    [key: string]: {
        entry: string;
    };
}
type CallbackFunction = (error: Error | null, chunk?: any) => void;
/**
 * HttpVmStrategy
 * This function is used to execute a chunk of code in a VM using HTTP or HTTPS based on the protocol.
 * @param {string} chunkName - The name of the chunk to be executed.
 * @param {string} remoteName - The name of the remote server.
 * @param {Remotes} remotes - An object containing the remote servers.
 * @param {CallbackFunction} callback - A callback function to be executed after the chunk is executed.
 */
export declare function httpVmStrategy(chunkName: string, remoteName: string, remotes: Remotes, callback: CallbackFunction): Promise<void>;
export {};
