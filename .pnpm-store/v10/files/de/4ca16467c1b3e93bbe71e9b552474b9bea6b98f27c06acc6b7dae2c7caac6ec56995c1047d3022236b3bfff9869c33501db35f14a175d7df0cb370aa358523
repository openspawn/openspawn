/// <reference types="node" />
import * as fsP from 'node:fs/promises';
export declare const readFile: typeof fsP.readFile;
/**
 * Test to see if the directory exists
 * @param name
 * @returns
 */
export declare function statDir(name: string): Promise<void>;
/**
 *  test to see if the directory exists
 * @param name
 * @returns
 */
export declare function statFile(name: string): Promise<void>;
/**
 * Lock a file
 * @param name name of the file to lock
 */
export declare function lockFileWithOptions(name: string, options?: any): Promise<void>;
export declare function unlockFileNext(name: string): Promise<void>;
