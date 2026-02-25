import { ReadTarball } from '@verdaccio/streams';
import { Callback, Config, Logger, Manifest, MergeTags, Package, Version, Versions } from '@verdaccio/types';
import { Token, TokenFilter } from '@verdaccio/types';
import { IPluginFilters, ISyncUplinks, StringValue } from '../types';
import LocalStorage from './local-storage';
import ProxyStorage from './up-storage';
declare class Storage {
    localStorage: LocalStorage;
    config: Config;
    logger: Logger;
    uplinks: Record<string, ProxyStorage>;
    filters: IPluginFilters | undefined;
    constructor(config: Config);
    init(config: Config, filters?: IPluginFilters): Promise<void>;
    private loadStorage;
    private loadStorePlugin;
    /**
     *  Add a {name} package to a system
     Function checks if package with the same name is available from uplinks.
     If it isn't, we create package locally
     Used storages: local (write) && uplinks
     */
    addPackage(name: string, metadata: any, callback: any): Promise<void>;
    private _isAllowPublishOffline;
    readTokens(filter: TokenFilter): Promise<Token[]>;
    saveToken(token: Token): Promise<void>;
    deleteToken(user: string, tokenKey: string): Promise<any>;
    /**
     * Add a new version of package {name} to a system
     Used storages: local (write)
     */
    addVersion(name: string, version: string, metadata: Version, tag: StringValue, callback: Callback): void;
    /**
     * Tags a package version with a provided tag
     Used storages: local (write)
     */
    mergeTags(name: string, tagHash: MergeTags, callback: Callback): void;
    /**
     * Change an existing package (i.e. unpublish one version)
     Function changes a package info from local storage and all uplinks with write access./
     Used storages: local (write)
     */
    changePackage(name: string, metadata: Package, revision: string, callback: Callback): void;
    /**
     * Remove a package from a system
     Function removes a package from local storage
     Used storages: local (write)
     */
    removePackage(name: string, callback: Callback): void;
    /**
     Remove a tarball from a system
     Function removes a tarball from local storage.
     Tarball in question should not be linked to in any existing
     versions, i.e. package version should be unpublished first.
     Used storage: local (write)
     */
    removeTarball(name: string, filename: string, revision: string, callback: Callback): void;
    /**
     * Upload a tarball for {name} package
     Function is synchronous and returns a WritableStream
     Used storages: local (write)
     */
    addTarball(name: string, filename: string): import("@verdaccio/streams").UploadTarball;
    hasLocalTarball(name: string, filename: string): Promise<boolean>;
    /**
     Get a tarball from a storage for {name} package
     Function is synchronous and returns a ReadableStream
     Function tries to read tarball locally, if it fails then it reads package
     information in order to figure out where we can get this tarball from
     Used storages: local || uplink (just one)
     */
    getTarball(name: string, filename: string): ReadTarball;
    /**
     Retrieve a package metadata for {name} package
     Function invokes localStorage.getPackage and uplink.get_package for every
     uplink with proxy_access rights against {name} and combines results
     into one json object
     Used storages: local && uplink (proxy_access)
  
     * @param {object} options
     * @property {string} options.name Package Name
     * @property {object}  options.req Express `req` object
     * @property {boolean} options.keepUpLinkData keep up link info in package meta, last update, etc.
     * @property {function} options.callback Callback for receive data
     */
    getPackage(options: any): void;
    /**
     Retrieve remote and local packages more recent than {startkey}
     Function streams all packages from all uplinks first, and then
     local packages.
     Note that local packages could override registry ones just because
     they appear in JSON last. That's a trade-off we make to avoid
     memory issues.
     Used storages: local && uplink (proxy_access)
     * @param {*} startkey
     * @param {*} options
     * @return {Stream}
     */
    search(startkey: string, options: any): any;
    /**
     * Retrieve only private local packages
     * @param {*} callback
     */
    getLocalDatabase(callback: Callback): void;
    /**
     * Function fetches package metadata from uplinks and synchronizes it with local data
     if package is available locally, it MUST be provided in pkginfo
     returns callback(err, result, uplink_errors)
     */
    _syncUplinksMetadata(name: string, packageInfo: Manifest, options: ISyncUplinks, callback: Callback): void;
    /**
     * Set a hidden value for each version.
     * @param {Array} versions list of version
     * @param {String} upLink uplink name
     * @private
     */
    _updateVersionsHiddenUpLink(versions: Versions, upLink: ProxyStorage): void;
}
export default Storage;
