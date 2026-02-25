import type { Chunk, ChunkGraph } from 'webpack';
/**
 * Generates the hot module replacement (HMR) code.
 * @param {boolean} withHmr - Flag indicating whether HMR is enabled.
 * @param {string} rootOutputDir - The root output directory.
 * @returns {string} - The generated HMR code.
 */
export declare function generateHmrCode(withHmr: boolean, rootOutputDir: string): string;
/**
 * Retrieves the initial chunk IDs.
 * @param {Chunk} chunk - The chunk object.
 * @param {ChunkGraph} chunkGraph - The chunk graph object.
 * @param {any} chunkHasJs - Function to check if a chunk has JavaScript.
 * @returns {Set} - The set of initial chunk IDs.
 */
export declare function getInitialChunkIds(chunk: Chunk, chunkGraph: ChunkGraph, chunkHasJs: any): Set<Chunk.ChunkId>;
/**
 * Generates the loading code for chunks.
 * @param {boolean} withLoading - Flag indicating whether chunk loading is enabled.
 * @param {string} fn - The function name.
 * @param {any} hasJsMatcher - Function to check if a chunk has JavaScript.
 * @param {string} rootOutputDir - The root output directory.
 * @param {Record<string, string>} remotes - The remotes object.
 * @param {string | undefined} name - The name of the chunk.
 * @returns {string} - The generated loading code.
 */
export declare function generateLoadingCode(withLoading: boolean, fn: string, hasJsMatcher: any, rootOutputDir: string, remotes: Record<string, string>, name: string | undefined): string;
/**
 * Generates the HMR manifest code.
 * @param {boolean} withHmrManifest - Flag indicating whether HMR manifest is enabled.
 * @param {string} rootOutputDir - The root output directory.
 * @returns {string} - The generated HMR manifest code.
 */
export declare function generateHmrManifestCode(withHmrManifest: boolean, rootOutputDir: string): string;
/**
 * Handles the on chunk load event.
 * @param {boolean} withOnChunkLoad - Flag indicating whether on chunk load event is enabled.
 * @param {any} runtimeTemplate - The runtime template.
 * @returns {string} - The generated on chunk load event handler.
 */
export declare function handleOnChunkLoad(withOnChunkLoad: boolean, runtimeTemplate: any): string;
/**
 * Generates the load script for server-side execution. This function creates a script that loads a remote module
 * and executes it in the current context. It supports both browser and Node.js environments.
 * @param {any} runtimeTemplate - The runtime template used to generate the load script.
 * @returns {string} - The generated load script.
 */
export declare function generateLoadScript(runtimeTemplate: any): string;
export declare function generateInstallChunk(runtimeTemplate: any, withOnChunkLoad: boolean): string;
export declare function generateExternalInstallChunkCode(withExternalInstallChunk: boolean, debug: boolean | undefined): string;
