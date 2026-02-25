import { type HttpError } from 'http-errors';
import { constants } from '@verdaccio/core';
import { Callback } from '@verdaccio/types';
export declare const DEFAULT_BCRYPT_ROUNDS = 10;
type HtpasswdHashAlgorithm = constants.HtpasswdHashAlgorithm;
export interface HtpasswdHashConfig {
    algorithm: HtpasswdHashAlgorithm;
    rounds?: number;
}
export declare function lockAndRead(name: string, cb: Callback): void;
/**
 * parseHTPasswd - convert htpasswd lines to object.
 * @param {string} input
 * @returns {object}
 */
export declare function parseHTPasswd(input: string): Record<string, any>;
/**
 * verifyPassword - matches password and it's hash.
 * @param {string} passwd
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export declare function verifyPassword(passwd: string, hash: string): Promise<boolean>;
/**
 * generateHtpasswdLine - generates line for htpasswd file.
 * @param {string} user
 * @param {string} passwd
 * @param {HtpasswdHashConfig} hashConfig
 * @returns {string}
 */
export declare function generateHtpasswdLine(user: string, passwd: string, hashConfig: HtpasswdHashConfig): Promise<string>;
/**
 * addUserToHTPasswd - Generate a htpasswd format for .htpasswd
 * @param {string} body
 * @param {string} user
 * @param {string} passwd
 * @param {HtpasswdHashConfig} hashConfig
 * @returns {string}
 */
export declare function addUserToHTPasswd(body: string, user: string, passwd: string, hashConfig: HtpasswdHashConfig): Promise<string>;
/**
 * Sanity check for a user
 * @param {string} user
 * @param {object} users
 * @param {string} password
 * @param {Callback} verifyFn
 * @param {number} maxUsers
 * @returns {object}
 */
export declare function sanityCheck(user: string, password: string, verifyFn: Callback, users: {}, maxUsers: number): Promise<HttpError | null>;
/**
 * /**
 * changePasswordToHTPasswd - change password for existing user
 * @param {string} body
 * @param {string} user
 * @param {string} passwd
 * @param {string} newPasswd
 * @param {HtpasswdHashConfig} hashConfig
 * @returns {Promise<string>}
 */
export declare function changePasswordToHTPasswd(body: string, user: string, passwd: string, newPasswd: string, hashConfig: HtpasswdHashConfig): Promise<string>;
export declare function stringToUtf8(authentication: string): string;
export {};
