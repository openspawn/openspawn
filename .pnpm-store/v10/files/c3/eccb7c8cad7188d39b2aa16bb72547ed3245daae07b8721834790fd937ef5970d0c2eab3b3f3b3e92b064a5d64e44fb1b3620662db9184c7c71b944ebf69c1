import { constants, pluginUtils } from '@verdaccio/core';
import { Callback } from '@verdaccio/types';
type HtpasswdHashAlgorithm = constants.HtpasswdHashAlgorithm;
export type HTPasswdConfig = {
    file: string;
    algorithm?: HtpasswdHashAlgorithm;
    rounds?: number;
    max_users?: number;
    slow_verify_ms?: number;
};
export declare const DEFAULT_SLOW_VERIFY_MS = 200;
/**
 * HTPasswd - Verdaccio auth class
 */
export default class HTPasswd extends pluginUtils.Plugin<HTPasswdConfig> implements pluginUtils.Auth<HTPasswdConfig> {
    /**
     *
     * @param {*} config htpasswd file
     * @param {object} options config.yaml in object from
     */
    private users;
    private maxUsers;
    private hashConfig;
    private path;
    private slowVerifyMs;
    private logger;
    private lastTime;
    constructor(config: HTPasswdConfig, options: pluginUtils.PluginOptions);
    /**
     * authenticate - Authenticate user.
     * @param {string} user
     * @param {string} password
     * @param {function} cb
     * @returns {void}
     */
    authenticate(user: string, password: string, cb: Callback): void;
    /**
     * Add user
     * 1. lock file for writing (other processes can still read)
     * 2. reload .htpasswd
     * 3. write new data into .htpasswd.tmp
     * 4. move .htpasswd.tmp to .htpasswd
     * 5. reload .htpasswd
     * 6. unlock file
     *
     * @param {string} user
     * @param {string} password
     * @param {function} realCb
     * @returns {Promise<any>}
     */
    adduser(user: string, password: string, realCb: Callback): Promise<any>;
    /**
     * Reload users
     * @param {function} callback
     */
    reload(callback: Callback): void;
    private _writeFile;
    /**
     * changePassword - change password for existing user.
     * @param {string} user
     * @param {string} password
     * @param {string} newPassword
     * @param {function} realCb
     * @returns {function}
     */
    changePassword(user: string, password: string, newPassword: string, realCb: Callback): void;
}
export {};
