/// <reference types="node" />
/// <reference types="node" />
import { Hash } from 'node:crypto';
export declare const defaultTarballHashAlgorithm = "sha1";
export declare function createTarballHash(): Hash;
/**
 * Express doesn't do ETAGS with requests <= 1024b
 * we use md5 here, it works well on 1k+ bytes, but sucks with fewer data
 * could improve performance using crc32 after benchmarks.
 * @param {Object} data
 * @return {String}
 * @deprecated use @verdaccio/core
 */
export declare function stringToMD5(data: Buffer | string): string;
export declare function generateRandomHexString(length?: number): string;
