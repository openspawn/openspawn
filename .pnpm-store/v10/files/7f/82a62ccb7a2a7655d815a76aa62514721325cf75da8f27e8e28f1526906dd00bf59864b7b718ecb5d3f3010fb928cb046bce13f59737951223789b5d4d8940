import { ReadTarball, UploadTarball } from '@verdaccio/streams';
import { Callback, Config, Logger, Manifest, MergeTags, Token, TokenFilter, Version } from '@verdaccio/types';
import { StoragePluginLegacy } from '../../types/custom';
import { StringValue } from '../types';
export type StoragePlugin = StoragePluginLegacy<Config> | any;
/**
 * Implements Storage interface (same for storage.js, local-storage.js, up-storage.js).
 */
declare class LocalStorage {
    config: Config;
    storagePlugin: StoragePlugin;
    logger: Logger;
    constructor(config: Config, logger: Logger, localStorage: StoragePlugin);
    addPackage(name: string, pkg: Manifest, callback: Callback): void;
    /**
     * Remove package.
     * @param {*} name
     * @param {*} callback
     * @return {Function}
     */
    removePackage(name: string, callback: Callback): void;
    /**
     * Synchronize remote package info with the local one
     * @param {*} name
     * @param {*} packageInfo
     * @param {*} callback
     */
    updateVersions(name: string, packageInfo: Manifest, callback: Callback): void;
    /**
     * Add a new version to a previous local package.
     * @param {*} name
     * @param {*} version
     * @param {*} metadata
     * @param {*} tag
     * @param {*} callback
     */
    addVersion(name: string, version: string, metadata: Version, tag: StringValue, callback: Callback): void;
    /**
     * Merge a new list of tags for a local packages with the existing one.
     * @param {*} pkgName
     * @param {*} tags
     * @param {*} callback
     */
    mergeTags(pkgName: string, tags: MergeTags, callback: Callback): void;
    /**
     * Return version not found
     * @return {String}
     * @private
     */
    private _getVersionNotFound;
    /**
     * Return file no available
     * @return {String}
     * @private
     */
    private _getFileNotAvailable;
    /**
     * Update the package metadata, tags and attachments (tarballs).
     * Note: Currently supports unpublishing and deprecation.
     * @param {*} name
     * @param {*} incomingPkg
     * @param {*} revision
     * @param {*} callback
     * @return {Function}
     */
    changePackage(name: string, incomingPkg: Manifest, revision: string | void, callback: Callback): void;
    /**
     * Remove a tarball.
     * @param {*} name
     * @param {*} filename
     * @param {*} revision
     * @param {*} callback
     */
    removeTarball(name: string, filename: string, revision: string, callback: Callback): void;
    /**
     * Add a tarball.
     * @param {String} name
     * @param {String} filename
     * @return {Stream}
     */
    addTarball(name: string, filename: string): UploadTarball;
    /**
     * Get a tarball.
     * @param {*} name
     * @param {*} filename
     * @return {ReadTarball}
     */
    getTarball(name: string, filename: string): ReadTarball;
    /**
     * Return a stream that emits a read failure.
     * @private
     * @return {ReadTarball}
     */
    private _createFailureStreamResponse;
    /**
     * Return a stream that emits the tarball data
     * @param {Object} storage
     * @param {String} filename
     * @private
     * @return {ReadTarball}
     */
    private _streamSuccessReadTarBall;
    /**
     * Retrieve a package by name.
     * @param {*} name
     * @param {*} callback
     * @return {Function}
     */
    getPackageMetadata(name: string, callback?: Callback): void;
    /**
     * Search a local package.
     * @param {*} startKey
     * @param {*} options
     * @return {Function}
     */
    search(startKey: string, options: any): ReadTarball;
    /**
     * Retrieve a wrapper that provide access to the package location.
     * @param {Object} pkgName package name.
     * @return {Object}
     */
    private _getLocalStorage;
    /**
     * Read a json file from storage.
     * @param {Object} storage
     * @param {Function} callback
     */
    private _readPackage;
    /**
     * Walks through each package and calls `on_package` on them.
     * @param {*} onPackage
     * @param {*} onEnd
     */
    private _searchEachPackage;
    /**
     * Retrieve either a previous created local package or a boilerplate.
     * @param {*} pkgName
     * @param {*} callback
     * @return {Function}
     */
    private _readCreatePackage;
    private _createNewPackage;
    /**
     * Handle internal error
     * @param {*} err
     * @param {*} file
     * @param {*} message
     * @return {Object} Error instance
     */
    private _internalError;
    /**
     * @param {*} name package name
     * @param {*} updateHandler function(package, cb) - update function
     * @param {*} callback callback that gets invoked after it's all updated
     * @return {Function}
     */
    private _updatePackage;
    /**
     * Update the revision (_rev) string for a package.
     * @param {*} name
     * @param {*} json
     * @param {*} callback
     * @return {Function}
     */
    private _writePackage;
    private _setDefaultRevision;
    private _deleteAttachments;
    /**
     * Ensure the dist file remains as the same protocol
     * @param {Object} hash metadata
     * @param {String} upLinkKey registry key
     * @private
     */
    private _updateUplinkToRemoteProtocol;
    getSecret(config: Config): Promise<string>;
    saveToken(token: Token): Promise<any>;
    deleteToken(user: string, tokenKey: string): Promise<any>;
    readTokens(filter: TokenFilter): Promise<Token[]>;
}
export default LocalStorage;
