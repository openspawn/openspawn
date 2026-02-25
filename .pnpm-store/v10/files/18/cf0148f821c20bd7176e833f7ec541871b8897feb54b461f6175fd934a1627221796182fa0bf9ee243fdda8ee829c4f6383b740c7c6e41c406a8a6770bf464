import { ReadTarball } from '@verdaccio/streams';
import { Callback, Config, Logger, UpLinkConf } from '@verdaccio/types';
/**
 * Implements Storage interface
 * (same for storage.js, local-storage.js, up-storage.js)
 */
declare class ProxyStorage {
    config: UpLinkConf;
    failed_requests: number;
    userAgent: string;
    ca: string | void;
    logger: Logger;
    server_id: string;
    url: any;
    maxage: number;
    timeout: number;
    max_fails: number;
    fail_timeout: number;
    agent_options: any;
    upname: string;
    proxy: string | void;
    last_request_time: number | null;
    strict_ssl: boolean;
    /**
     * Constructor
     * @param {*} config
     * @param {*} mainConfig
     */
    constructor(config: UpLinkConf, mainConfig: Config);
    /**
     * Fetch an asset.
     * @param {*} options
     * @param {*} cb
     * @return {Request}
     */
    private request;
    /**
     * Set default headers.
     * @param {Object} options
     * @return {Object}
     * @private
     */
    private _setHeaders;
    /**
     * Validate configuration auth and assign Header authorization
     * @param {Object} headers
     * @return {Object}
     * @private
     */
    private _setAuth;
    /**
     * @param {string} message
     * @throws {Error}
     * @private
     */
    private _throwErrorAuth;
    /**
     * Assign Header authorization with type authentication
     * @param {Object} headers
     * @param {string} type
     * @param {string} token
     * @private
     */
    private _setHeaderAuthorization;
    /**
     * It will add or override specified headers from config file.
     *
     * Eg:
     *
     * uplinks:
     npmjs:
     url: https://registry.npmjs.org/
     headers:
     Accept: "application/vnd.npm.install-v2+json; q=1.0"
     verdaccio-staging:
     url: https://mycompany.com/npm
     headers:
     Accept: "application/json"
     authorization: "Basic YourBase64EncodedCredentials=="
  
     * @param {Object} headers
     * @private
     */
    private _overrideWithUpLinkConfigHeaders;
    /**
     * Determine whether can fetch from the provided URL
     * @param {*} url
     * @return {Boolean}
     */
    isUplinkValid(url: string): boolean;
    /**
     * Get a remote package metadata
     * @param {*} name package name
     * @param {*} options request options, eg: eTag.
     * @param {*} callback
     */
    getRemoteMetadata(name: string, options: any, callback: Callback): void;
    /**
     * Fetch a tarball from the uplink.
     * @param {String} url
     * @return {Stream}
     */
    fetchTarball(url: string): ReadTarball;
    /**
     * Perform a stream search.
     * @param {*} options request options
     * @return {Stream}
     */
    search(options: any): any;
    /**
     * Add proxy headers.
     * FIXME: object mutations, it should return an new object
     * @param {*} req the http request
     * @param {*} headers the request headers
     */
    private _addProxyHeaders;
    /**
     * Check whether the remote host is available.
     * @param {*} alive
     * @return {Boolean}
     */
    private _statusCheck;
    /**
     * If the request failure.
     * @return {boolean}
     * @private
     */
    private _ifRequestFailure;
    /**
     * Set up a proxy.
     * @param {*} hostname
     * @param {*} config
     * @param {*} mainconfig
     * @param {*} isHTTPS
     */
    private _setupProxy;
}
export default ProxyStorage;
