"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _assert = _interopRequireDefault(require("assert"));
var _async = _interopRequireDefault(require("async"));
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _stream = _interopRequireDefault(require("stream"));
var _config = require("@verdaccio/config");
var _core = require("@verdaccio/core");
var _loaders = require("@verdaccio/loaders");
var _localStorageLegacy = _interopRequireDefault(require("@verdaccio/local-storage-legacy"));
var _searchIndexer = require("@verdaccio/search-indexer");
var _streams = require("@verdaccio/streams");
var _logger = require("../lib/logger");
var _constants = require("./constants");
var _localStorage = _interopRequireDefault(require("./local-storage"));
var _metadataUtils = require("./metadata-utils");
var _storageUtils = require("./storage-utils");
var _upStorage = _interopRequireDefault(require("./up-storage"));
var _uplinkUtil = require("./uplink-util");
var _utils = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:storage');
class Storage {
  constructor(config) {
    this.config = config;
    this.uplinks = (0, _uplinkUtil.setupUpLinks)(config);
    this.logger = _logger.logger;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.localStorage = null;
  }
  async init(config, filters) {
    if (this.localStorage === null) {
      this.filters = filters;
      const storageInstance = await this.loadStorage(config, this.logger);
      this.localStorage = new _localStorage.default(this.config, _logger.logger, storageInstance);
      await this.localStorage.getSecret(config);
      debug('initialization completed');
    } else {
      debug('storage has been already initialized');
    }
    if (!this.filters) {
      this.filters = await (0, _loaders.asyncLoadPlugin)(this.config.filters, {
        config: this.config,
        logger: this.logger
      }, plugin => {
        return typeof plugin.filter_metadata !== 'undefined';
      }, true, this.config?.serverSettings?.pluginPrefix, _core.PLUGIN_CATEGORY.FILTER);
      debug('filters available %o', this.filters.length);
    }
  }
  async loadStorage(config, logger) {
    const Storage = await this.loadStorePlugin();
    if (_lodash.default.isNil(Storage)) {
      (0, _assert.default)(this.config.storage, 'CONFIG: storage path not defined');
      debug('no custom storage found, loading default storage @verdaccio/local-storage');
      const localStorage = new _localStorageLegacy.default(config, logger);
      logger.info({
        name: '@verdaccio/local-storage',
        pluginCategory: _core.PLUGIN_CATEGORY.STORAGE
      }, 'plugin @{name} successfully loaded (@{pluginCategory})');
      return localStorage;
    }
    return Storage;
  }
  async loadStorePlugin() {
    const plugins = await (0, _loaders.asyncLoadPlugin)(this.config.store, {
      config: this.config,
      logger: this.logger
    }, plugin => {
      return typeof plugin.getPackageStorage !== 'undefined';
    }, true, this.config?.serverSettings?.pluginPrefix, _core.PLUGIN_CATEGORY.STORAGE);
    if (plugins.length > 1) {
      this.logger.warn('more than one storage plugins has been detected, multiple storage are not supported, one will be selected automatically');
    }
    return _lodash.default.head(plugins);
  }

  /**
   *  Add a {name} package to a system
   Function checks if package with the same name is available from uplinks.
   If it isn't, we create package locally
   Used storages: local (write) && uplinks
   */
  async addPackage(name, metadata, callback) {
    try {
      await (0, _storageUtils.checkPackageLocal)(name, this.localStorage);
      await (0, _storageUtils.checkPackageRemote)(name, this._isAllowPublishOffline(), this._syncUplinksMetadata.bind(this));
      await (0, _storageUtils.publishPackage)(name, metadata, this.localStorage);
      callback();
    } catch (err) {
      callback(err);
    }
  }
  _isAllowPublishOffline() {
    return typeof this.config.publish !== 'undefined' && _lodash.default.isBoolean(this.config.publish.allow_offline) && this.config.publish.allow_offline;
  }
  readTokens(filter) {
    return this.localStorage.readTokens(filter);
  }
  saveToken(token) {
    return this.localStorage.saveToken(token);
  }
  deleteToken(user, tokenKey) {
    return this.localStorage.deleteToken(user, tokenKey);
  }

  /**
   * Add a new version of package {name} to a system
   Used storages: local (write)
   */
  addVersion(name, version, metadata, tag, callback) {
    this.localStorage.addVersion(name, version, metadata, tag, callback);
  }

  /**
   * Tags a package version with a provided tag
   Used storages: local (write)
   */
  mergeTags(name, tagHash, callback) {
    this.localStorage.mergeTags(name, tagHash, callback);
  }

  /**
   * Change an existing package (i.e. unpublish one version)
   Function changes a package info from local storage and all uplinks with write access./
   Used storages: local (write)
   */
  changePackage(name, metadata, revision, callback) {
    this.localStorage.changePackage(name, metadata, revision, callback);
  }

  /**
   * Remove a package from a system
   Function removes a package from local storage
   Used storages: local (write)
   */
  removePackage(name, callback) {
    this.localStorage.removePackage(name, callback);
    // update the indexer
    _searchIndexer.SearchMemoryIndexer.remove(name).catch(reason => {
      debug('indexer has failed on remove item %o', reason);
      _logger.logger.error('indexer has failed on remove item');
    });
  }

  /**
   Remove a tarball from a system
   Function removes a tarball from local storage.
   Tarball in question should not be linked to in any existing
   versions, i.e. package version should be unpublished first.
   Used storage: local (write)
   */
  removeTarball(name, filename, revision, callback) {
    this.localStorage.removeTarball(name, filename, revision, callback);
  }

  /**
   * Upload a tarball for {name} package
   Function is synchronous and returns a WritableStream
   Used storages: local (write)
   */
  addTarball(name, filename) {
    return this.localStorage.addTarball(name, filename);
  }
  hasLocalTarball(name, filename) {
    const self = this;
    return new Promise((resolve, reject) => {
      let localStream = self.localStorage.getTarball(name, filename);
      let isOpen = false;
      localStream.on('error', err => {
        if (isOpen || err.status !== _constants.HTTP_STATUS.NOT_FOUND) {
          reject(err);
        }
        // local reported 404 or request was aborted already
        if (localStream) {
          localStream.abort();
          localStream = null;
        }
        resolve(false);
      });
      localStream.on('open', function () {
        isOpen = true;
        localStream.abort();
        localStream = null;
        resolve(true);
      });
    });
  }

  /**
   Get a tarball from a storage for {name} package
   Function is synchronous and returns a ReadableStream
   Function tries to read tarball locally, if it fails then it reads package
   information in order to figure out where we can get this tarball from
   Used storages: local || uplink (just one)
   */
  getTarball(name, filename) {
    const readStream = new _streams.ReadTarball({});
    readStream.abort = function () {};
    const self = this;

    // if someone requesting tarball, it means that we should already have some
    // information about it, so fetching package info is unnecessary

    // trying local first
    // flow: should be IReadTarball
    let localStream = self.localStorage.getTarball(name, filename);
    let isOpen = false;
    localStream.on('error', err => {
      if (isOpen || err.status !== _constants.HTTP_STATUS.NOT_FOUND) {
        return readStream.emit('error', err);
      }

      // local reported 404
      const err404 = err;
      localStream.abort();
      localStream = null; // we force for garbage collector
      self.localStorage.getPackageMetadata(name, (err, info) => {
        if (_lodash.default.isNil(err) && info._distfiles && _lodash.default.isNil(info._distfiles[filename]) === false) {
          // information about this file exists locally
          serveFile(info._distfiles[filename]);
        } else {
          // we know nothing about this file, trying to get information elsewhere
          self._syncUplinksMetadata(name, info, {}, (err, info) => {
            if (_lodash.default.isNil(err) === false) {
              return readStream.emit('error', err);
            }
            if (_lodash.default.isNil(info._distfiles) || _lodash.default.isNil(info._distfiles[filename])) {
              return readStream.emit('error', err404);
            }
            serveFile(info._distfiles[filename]);
          });
        }
      });
    });
    localStream.on('content-length', function (v) {
      readStream.emit('content-length', v);
    });
    localStream.on('open', function () {
      isOpen = true;
      localStream.pipe(readStream);
    });
    return readStream;

    /**
     * Fetch and cache local/remote packages.
     * @param {Object} file define the package shape
     */
    function serveFile(file) {
      let uplink = null;
      for (const uplinkId in self.uplinks) {
        if ((0, _config.hasProxyTo)(name, uplinkId, self.config.packages)) {
          uplink = self.uplinks[uplinkId];
        }
      }
      if (uplink == null) {
        uplink = new _upStorage.default({
          url: file.url,
          cache: true,
          _autogenerated: true
        }, self.config);
      }
      let savestream = null;
      if (uplink.config.cache) {
        savestream = self.localStorage.addTarball(name, filename);
      }
      let on_open = function () {
        // prevent it from being called twice
        on_open = function () {};
        const rstream2 = uplink.fetchTarball(file.url);
        rstream2.on('error', function (err) {
          if (savestream) {
            savestream.abort();
          }
          savestream = null;
          readStream.emit('error', err);
        });
        rstream2.on('end', function () {
          if (savestream) {
            savestream.done();
          }
        });
        rstream2.on('content-length', function (v) {
          readStream.emit('content-length', v);
          if (savestream) {
            savestream.emit('content-length', v);
          }
        });
        rstream2.pipe(readStream);
        if (savestream) {
          rstream2.pipe(savestream);
        }
      };
      if (savestream) {
        savestream.on('open', function () {
          on_open();
        });
        savestream.on('error', function (err) {
          self.logger.warn({
            err: err,
            fileName: file
          }, 'error saving file @{fileName}: @{err.message}\n@{err.stack}');
          if (savestream) {
            savestream.abort();
          }
          savestream = null;
          on_open();
        });
      } else {
        on_open();
      }
    }
  }

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
  getPackage(options) {
    this.localStorage.getPackageMetadata(options.name, (err, data) => {
      if (err && (!err.status || err.status >= _constants.HTTP_STATUS.INTERNAL_ERROR)) {
        // report internal errors right away
        return options.callback(err);
      }
      this._syncUplinksMetadata(options.name, data, {
        req: options.req,
        uplinksLook: options.uplinksLook
      }, function getPackageSynUpLinksCallback(err, result, uplinkErrors) {
        if (err) {
          return options.callback(err);
        }
        (0, _utils.normalizeDistTags)((0, _storageUtils.cleanUpLinksRef)(options.keepUpLinkData, result));

        // npm can throw if this field doesn't exist
        result._attachments = {};
        if (options.abbreviated === true) {
          options.callback(null, (0, _storageUtils.convertAbbreviatedManifest)(result), uplinkErrors);
        } else {
          options.callback(null, result, uplinkErrors);
        }
      });
    });
  }

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
  search(startkey, options) {
    const self = this;
    const searchStream = new _stream.default.PassThrough({
      objectMode: true
    });
    _async.default.eachSeries(Object.keys(this.uplinks), function (up_name, cb) {
      // shortcut: if `local=1` is supplied, don't call uplinks
      if (options.req?.query?.local !== undefined) {
        return cb();
      }
      _logger.logger.info(`search for uplink ${up_name}`);
      // search by keyword for each uplink
      const uplinkStream = self.uplinks[up_name].search(options);
      // join uplink stream with streams PassThrough
      uplinkStream.pipe(searchStream, {
        end: false
      });
      uplinkStream.on('error', function (err) {
        self.logger.error({
          err: err
        }, 'uplink error: @{err.message}');
        cb();
        // to avoid call callback more than once
        cb = function () {};
      });
      uplinkStream.on('end', function () {
        cb();
        // to avoid call callback more than once
        cb = function () {};
      });
      searchStream.abort = function () {
        if (uplinkStream.abort) {
          uplinkStream.abort();
        }
        cb();
        // to avoid call callback more than once
        cb = function () {};
      };
    },
    // executed after all series
    function () {
      // attach a local search results
      const localSearchStream = self.localStorage.search(startkey, options);
      searchStream.abort = function () {
        localSearchStream.abort();
      };
      localSearchStream.pipe(searchStream, {
        end: true
      });
      localSearchStream.on('error', function (err) {
        self.logger.error({
          err: err
        }, 'search error: @{err.message}');
        searchStream.end();
      });
    });
    return searchStream;
  }

  /**
   * Retrieve only private local packages
   * @param {*} callback
   */
  getLocalDatabase(callback) {
    const self = this;
    this.localStorage.storagePlugin.get((err, locals) => {
      if (err) {
        callback(err);
      }
      const packages = [];
      const getPackage = function (itemPkg) {
        self.localStorage.getPackageMetadata(locals[itemPkg], function (err, pkgMetadata) {
          if (_lodash.default.isNil(err)) {
            const latest = pkgMetadata[_constants.DIST_TAGS].latest;
            if (latest && pkgMetadata.versions[latest]) {
              const version = pkgMetadata.versions[latest];
              const timeList = pkgMetadata.time;
              const time = timeList[latest];
              // @ts-ignore
              version.time = time;

              // Add for stars api
              // @ts-ignore
              version.users = pkgMetadata.users;
              packages.push(version);
            } else {
              self.logger.warn({
                package: locals[itemPkg]
              }, 'package @{package} does not have a "latest" tag?');
            }
          }
          if (itemPkg >= locals.length - 1) {
            callback(null, packages);
          } else {
            getPackage(itemPkg + 1);
          }
        });
      };
      if (locals.length) {
        getPackage(0);
      } else {
        callback(null, []);
      }
    });
  }

  /**
   * Function fetches package metadata from uplinks and synchronizes it with local data
   if package is available locally, it MUST be provided in pkginfo
   returns callback(err, result, uplink_errors)
   */
  _syncUplinksMetadata(name, packageInfo, options, callback) {
    let found = true;
    const self = this;
    const upLinks = [];
    const hasToLookIntoUplinks = _lodash.default.isNil(options.uplinksLook) || options.uplinksLook;
    if (!packageInfo) {
      found = false;
      packageInfo = (0, _storageUtils.generatePackageTemplate)(name);
    }
    for (const uplink in this.uplinks) {
      if ((0, _config.hasProxyTo)(name, uplink, this.config.packages) && hasToLookIntoUplinks) {
        upLinks.push(this.uplinks[uplink]);
      }
    }
    _async.default.map(upLinks, (upLink, cb) => {
      const _options = Object.assign({}, options);
      const upLinkMeta = packageInfo._uplinks[upLink.upname];
      if ((0, _utils.isObject)(upLinkMeta)) {
        const fetched = upLinkMeta.fetched;
        if (fetched && Date.now() - fetched < upLink.maxage) {
          return cb();
        }
        _options.etag = upLinkMeta.etag;
      }
      upLink.getRemoteMetadata(name, _options, (err, upLinkResponse, eTag) => {
        if (err && err.remoteStatus === 304) {
          upLinkMeta.fetched = Date.now();
        }
        if (err || !upLinkResponse) {
          return cb(null, [err || _utils.ErrorCode.getInternalError('no data')]);
        }
        try {
          upLinkResponse = _core.validationUtils.normalizeMetadata(upLinkResponse, name);
        } catch (err) {
          self.logger.error({
            sub: 'out',
            err: err
          }, 'package.json validating error @{!err.message}\n@{err.stack}');
          return cb(null, [err]);
        }
        packageInfo._uplinks[upLink.upname] = {
          etag: eTag,
          fetched: Date.now()
        };
        packageInfo = (0, _storageUtils.mergeUplinkTimeIntoLocal)(packageInfo, upLinkResponse);
        (0, _uplinkUtil.updateVersionsHiddenUpLink)(upLinkResponse.versions, upLink);
        try {
          (0, _metadataUtils.mergeVersions)(packageInfo, upLinkResponse);
        } catch (err) {
          self.logger.error({
            sub: 'out',
            err: err
          }, 'package.json parsing error @{!err.message}\n@{err.stack}');
          return cb(null, [err]);
        }

        // if we got to this point, assume that the correct package exists
        // on the uplink
        found = true;
        cb();
      });
    },
    // @ts-ignore
    (err, upLinksErrors) => {
      (0, _assert.default)(!err && Array.isArray(upLinksErrors));

      // Check for connection timeout or reset errors with uplink(s)
      // (these should be handled differently from the package not being found)
      if (!found) {
        let uplinkTimeoutError;
        for (let i = 0; i < upLinksErrors.length; i++) {
          if (upLinksErrors[i]) {
            for (let j = 0; j < upLinksErrors[i].length; j++) {
              if (upLinksErrors[i][j]) {
                const code = upLinksErrors[i][j].code;
                if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT' || code === 'ECONNRESET') {
                  uplinkTimeoutError = true;
                  break;
                }
              }
            }
          }
        }
        if (uplinkTimeoutError) {
          return callback(_utils.ErrorCode.getServiceUnavailable(), null, upLinksErrors);
        }
        return callback(_utils.ErrorCode.getNotFound(_constants.API_ERROR.NO_PACKAGE), null, upLinksErrors);
      }
      if (upLinks.length === 0) {
        return callback(null, packageInfo);
      }
      self.localStorage.updateVersions(name, packageInfo, async (err, packageJsonLocal) => {
        if (err) {
          return callback(err);
        }
        // Any error here will cause a 404, like an uplink error. This is likely the right thing to do
        // as a broken filter is a security risk.
        const filterErrors = [];
        // This MUST be done serially and not in parallel as they modify packageJsonLocal
        for (const filter of self.filters ?? []) {
          try {
            // These filters can assume it's save to modify packageJsonLocal and return it directly for
            // performance (i.e. need not be pure)
            packageJsonLocal = await filter.filter_metadata(packageJsonLocal);
          } catch (err) {
            filterErrors.push(err);
          }
        }
        callback(null, packageJsonLocal, _lodash.default.concat(upLinksErrors, filterErrors));
      });
    });
  }

  /**
   * Set a hidden value for each version.
   * @param {Array} versions list of version
   * @param {String} upLink uplink name
   * @private
   */
  _updateVersionsHiddenUpLink(versions, upLink) {
    for (const i in versions) {
      if (Object.prototype.hasOwnProperty.call(versions, i)) {
        const version = versions[i];

        // holds a "hidden" value to be used by the package storage.
        version[Symbol.for('__verdaccio_uplink')] = upLink.upname;
      }
    }
  }
}
var _default = exports.default = Storage;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYXN5bmMiLCJfZGVidWciLCJfbG9kYXNoIiwiX3N0cmVhbSIsIl9jb25maWciLCJfY29yZSIsIl9sb2FkZXJzIiwiX2xvY2FsU3RvcmFnZUxlZ2FjeSIsIl9zZWFyY2hJbmRleGVyIiwiX3N0cmVhbXMiLCJfbG9nZ2VyIiwiX2NvbnN0YW50cyIsIl9sb2NhbFN0b3JhZ2UiLCJfbWV0YWRhdGFVdGlscyIsIl9zdG9yYWdlVXRpbHMiLCJfdXBTdG9yYWdlIiwiX3VwbGlua1V0aWwiLCJfdXRpbHMiLCJlIiwiX19lc01vZHVsZSIsImRlZmF1bHQiLCJkZWJ1ZyIsImJ1aWxkRGVidWciLCJTdG9yYWdlIiwiY29uc3RydWN0b3IiLCJjb25maWciLCJ1cGxpbmtzIiwic2V0dXBVcExpbmtzIiwibG9nZ2VyIiwibG9jYWxTdG9yYWdlIiwiaW5pdCIsImZpbHRlcnMiLCJzdG9yYWdlSW5zdGFuY2UiLCJsb2FkU3RvcmFnZSIsIkxvY2FsU3RvcmFnZSIsImdldFNlY3JldCIsImFzeW5jTG9hZFBsdWdpbiIsInBsdWdpbiIsImZpbHRlcl9tZXRhZGF0YSIsInNlcnZlclNldHRpbmdzIiwicGx1Z2luUHJlZml4IiwiUExVR0lOX0NBVEVHT1JZIiwiRklMVEVSIiwibGVuZ3RoIiwibG9hZFN0b3JlUGx1Z2luIiwiXyIsImlzTmlsIiwiYXNzZXJ0Iiwic3RvcmFnZSIsIkxvY2FsRGF0YWJhc2VQbHVnaW4iLCJpbmZvIiwibmFtZSIsInBsdWdpbkNhdGVnb3J5IiwiU1RPUkFHRSIsInBsdWdpbnMiLCJzdG9yZSIsImdldFBhY2thZ2VTdG9yYWdlIiwid2FybiIsImhlYWQiLCJhZGRQYWNrYWdlIiwibWV0YWRhdGEiLCJjYWxsYmFjayIsImNoZWNrUGFja2FnZUxvY2FsIiwiY2hlY2tQYWNrYWdlUmVtb3RlIiwiX2lzQWxsb3dQdWJsaXNoT2ZmbGluZSIsIl9zeW5jVXBsaW5rc01ldGFkYXRhIiwiYmluZCIsInB1Ymxpc2hQYWNrYWdlIiwiZXJyIiwicHVibGlzaCIsImlzQm9vbGVhbiIsImFsbG93X29mZmxpbmUiLCJyZWFkVG9rZW5zIiwiZmlsdGVyIiwic2F2ZVRva2VuIiwidG9rZW4iLCJkZWxldGVUb2tlbiIsInVzZXIiLCJ0b2tlbktleSIsImFkZFZlcnNpb24iLCJ2ZXJzaW9uIiwidGFnIiwibWVyZ2VUYWdzIiwidGFnSGFzaCIsImNoYW5nZVBhY2thZ2UiLCJyZXZpc2lvbiIsInJlbW92ZVBhY2thZ2UiLCJTZWFyY2hNZW1vcnlJbmRleGVyIiwicmVtb3ZlIiwiY2F0Y2giLCJyZWFzb24iLCJlcnJvciIsInJlbW92ZVRhcmJhbGwiLCJmaWxlbmFtZSIsImFkZFRhcmJhbGwiLCJoYXNMb2NhbFRhcmJhbGwiLCJzZWxmIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJsb2NhbFN0cmVhbSIsImdldFRhcmJhbGwiLCJpc09wZW4iLCJvbiIsInN0YXR1cyIsIkhUVFBfU1RBVFVTIiwiTk9UX0ZPVU5EIiwiYWJvcnQiLCJyZWFkU3RyZWFtIiwiUmVhZFRhcmJhbGwiLCJlbWl0IiwiZXJyNDA0IiwiZ2V0UGFja2FnZU1ldGFkYXRhIiwiX2Rpc3RmaWxlcyIsInNlcnZlRmlsZSIsInYiLCJwaXBlIiwiZmlsZSIsInVwbGluayIsInVwbGlua0lkIiwiaGFzUHJveHlUbyIsInBhY2thZ2VzIiwiUHJveHlTdG9yYWdlIiwidXJsIiwiY2FjaGUiLCJfYXV0b2dlbmVyYXRlZCIsInNhdmVzdHJlYW0iLCJvbl9vcGVuIiwicnN0cmVhbTIiLCJmZXRjaFRhcmJhbGwiLCJkb25lIiwiZmlsZU5hbWUiLCJnZXRQYWNrYWdlIiwib3B0aW9ucyIsImRhdGEiLCJJTlRFUk5BTF9FUlJPUiIsInJlcSIsInVwbGlua3NMb29rIiwiZ2V0UGFja2FnZVN5blVwTGlua3NDYWxsYmFjayIsInJlc3VsdCIsInVwbGlua0Vycm9ycyIsIm5vcm1hbGl6ZURpc3RUYWdzIiwiY2xlYW5VcExpbmtzUmVmIiwia2VlcFVwTGlua0RhdGEiLCJfYXR0YWNobWVudHMiLCJhYmJyZXZpYXRlZCIsImNvbnZlcnRBYmJyZXZpYXRlZE1hbmlmZXN0Iiwic2VhcmNoIiwic3RhcnRrZXkiLCJzZWFyY2hTdHJlYW0iLCJTdHJlYW0iLCJQYXNzVGhyb3VnaCIsIm9iamVjdE1vZGUiLCJhc3luYyIsImVhY2hTZXJpZXMiLCJPYmplY3QiLCJrZXlzIiwidXBfbmFtZSIsImNiIiwicXVlcnkiLCJsb2NhbCIsInVuZGVmaW5lZCIsInVwbGlua1N0cmVhbSIsImVuZCIsImxvY2FsU2VhcmNoU3RyZWFtIiwiZ2V0TG9jYWxEYXRhYmFzZSIsInN0b3JhZ2VQbHVnaW4iLCJnZXQiLCJsb2NhbHMiLCJpdGVtUGtnIiwicGtnTWV0YWRhdGEiLCJsYXRlc3QiLCJESVNUX1RBR1MiLCJ2ZXJzaW9ucyIsInRpbWVMaXN0IiwidGltZSIsInVzZXJzIiwicHVzaCIsInBhY2thZ2UiLCJwYWNrYWdlSW5mbyIsImZvdW5kIiwidXBMaW5rcyIsImhhc1RvTG9va0ludG9VcGxpbmtzIiwiZ2VuZXJhdGVQYWNrYWdlVGVtcGxhdGUiLCJtYXAiLCJ1cExpbmsiLCJfb3B0aW9ucyIsImFzc2lnbiIsInVwTGlua01ldGEiLCJfdXBsaW5rcyIsInVwbmFtZSIsImlzT2JqZWN0IiwiZmV0Y2hlZCIsIkRhdGUiLCJub3ciLCJtYXhhZ2UiLCJldGFnIiwiZ2V0UmVtb3RlTWV0YWRhdGEiLCJ1cExpbmtSZXNwb25zZSIsImVUYWciLCJyZW1vdGVTdGF0dXMiLCJFcnJvckNvZGUiLCJnZXRJbnRlcm5hbEVycm9yIiwidmFsaWRhdGlvblV0aWxzIiwibm9ybWFsaXplTWV0YWRhdGEiLCJzdWIiLCJtZXJnZVVwbGlua1RpbWVJbnRvTG9jYWwiLCJ1cGRhdGVWZXJzaW9uc0hpZGRlblVwTGluayIsIm1lcmdlVmVyc2lvbnMiLCJ1cExpbmtzRXJyb3JzIiwiQXJyYXkiLCJpc0FycmF5IiwidXBsaW5rVGltZW91dEVycm9yIiwiaSIsImoiLCJjb2RlIiwiZ2V0U2VydmljZVVuYXZhaWxhYmxlIiwiZ2V0Tm90Rm91bmQiLCJBUElfRVJST1IiLCJOT19QQUNLQUdFIiwidXBkYXRlVmVyc2lvbnMiLCJwYWNrYWdlSnNvbkxvY2FsIiwiZmlsdGVyRXJyb3JzIiwiY29uY2F0IiwiX3VwZGF0ZVZlcnNpb25zSGlkZGVuVXBMaW5rIiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiU3ltYm9sIiwiZm9yIiwiX2RlZmF1bHQiLCJleHBvcnRzIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9zdG9yYWdlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCBhc3luYywgeyBBc3luY1Jlc3VsdEFycmF5Q2FsbGJhY2sgfSBmcm9tICdhc3luYyc7XG5pbXBvcnQgYnVpbGREZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IFN0cmVhbSBmcm9tICdzdHJlYW0nO1xuXG5pbXBvcnQgeyBoYXNQcm94eVRvIH0gZnJvbSAnQHZlcmRhY2Npby9jb25maWcnO1xuaW1wb3J0IHsgUExVR0lOX0NBVEVHT1JZLCBwbHVnaW5VdGlscywgdmFsaWRhdGlvblV0aWxzIH0gZnJvbSAnQHZlcmRhY2Npby9jb3JlJztcbmltcG9ydCB7IGFzeW5jTG9hZFBsdWdpbiB9IGZyb20gJ0B2ZXJkYWNjaW8vbG9hZGVycyc7XG5pbXBvcnQgTG9jYWxEYXRhYmFzZVBsdWdpbiBmcm9tICdAdmVyZGFjY2lvL2xvY2FsLXN0b3JhZ2UtbGVnYWN5JztcbmltcG9ydCB7IFNlYXJjaE1lbW9yeUluZGV4ZXIgfSBmcm9tICdAdmVyZGFjY2lvL3NlYXJjaC1pbmRleGVyJztcbmltcG9ydCB7IFJlYWRUYXJiYWxsIH0gZnJvbSAnQHZlcmRhY2Npby9zdHJlYW1zJztcbmltcG9ydCB7XG4gIENhbGxiYWNrLFxuICBDb25maWcsXG4gIERpc3RGaWxlLFxuICBMb2dnZXIsXG4gIE1hbmlmZXN0LFxuICBNZXJnZVRhZ3MsXG4gIFBhY2thZ2UsXG4gIFZlcnNpb24sXG4gIFZlcnNpb25zLFxufSBmcm9tICdAdmVyZGFjY2lvL3R5cGVzJztcbmltcG9ydCB7IEdlbmVyaWNCb2R5LCBUb2tlbiwgVG9rZW5GaWx0ZXIgfSBmcm9tICdAdmVyZGFjY2lvL3R5cGVzJztcblxuaW1wb3J0IHsgU3RvcmFnZVBsdWdpbkxlZ2FjeSB9IGZyb20gJy4uLy4uL3R5cGVzL2N1c3RvbSc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi9saWIvbG9nZ2VyJztcbmltcG9ydCB7IElQbHVnaW5GaWx0ZXJzLCBJU3luY1VwbGlua3MsIFN0cmluZ1ZhbHVlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgQVBJX0VSUk9SLCBESVNUX1RBR1MsIEhUVFBfU1RBVFVTIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IExvY2FsU3RvcmFnZSwgeyBTdG9yYWdlUGx1Z2luIH0gZnJvbSAnLi9sb2NhbC1zdG9yYWdlJztcbmltcG9ydCB7IG1lcmdlVmVyc2lvbnMgfSBmcm9tICcuL21ldGFkYXRhLXV0aWxzJztcbmltcG9ydCB7XG4gIGNoZWNrUGFja2FnZUxvY2FsLFxuICBjaGVja1BhY2thZ2VSZW1vdGUsXG4gIGNsZWFuVXBMaW5rc1JlZixcbiAgY29udmVydEFiYnJldmlhdGVkTWFuaWZlc3QsXG4gIGdlbmVyYXRlUGFja2FnZVRlbXBsYXRlLFxuICBtZXJnZVVwbGlua1RpbWVJbnRvTG9jYWwsXG4gIHB1Ymxpc2hQYWNrYWdlLFxufSBmcm9tICcuL3N0b3JhZ2UtdXRpbHMnO1xuaW1wb3J0IFByb3h5U3RvcmFnZSBmcm9tICcuL3VwLXN0b3JhZ2UnO1xuaW1wb3J0IHsgc2V0dXBVcExpbmtzLCB1cGRhdGVWZXJzaW9uc0hpZGRlblVwTGluayB9IGZyb20gJy4vdXBsaW5rLXV0aWwnO1xuaW1wb3J0IHsgRXJyb3JDb2RlLCBpc09iamVjdCwgbm9ybWFsaXplRGlzdFRhZ3MgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgZGVidWcgPSBidWlsZERlYnVnKCd2ZXJkYWNjaW86c3RvcmFnZScpO1xuXG5jbGFzcyBTdG9yYWdlIHtcbiAgcHVibGljIGxvY2FsU3RvcmFnZTogTG9jYWxTdG9yYWdlO1xuICBwdWJsaWMgY29uZmlnOiBDb25maWc7XG4gIHB1YmxpYyBsb2dnZXI6IExvZ2dlcjtcbiAgcHVibGljIHVwbGlua3M6IFJlY29yZDxzdHJpbmcsIFByb3h5U3RvcmFnZT47XG4gIHB1YmxpYyBmaWx0ZXJzOiBJUGx1Z2luRmlsdGVycyB8IHVuZGVmaW5lZDtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoY29uZmlnOiBDb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnVwbGlua3MgPSBzZXR1cFVwTGlua3MoY29uZmlnKTtcbiAgICB0aGlzLmxvZ2dlciA9IGxvZ2dlcjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1jb21tZW50XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHRoaXMubG9jYWxTdG9yYWdlID0gbnVsbDtcbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBpbml0KGNvbmZpZzogQ29uZmlnLCBmaWx0ZXJzPzogSVBsdWdpbkZpbHRlcnMpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5sb2NhbFN0b3JhZ2UgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuZmlsdGVycyA9IGZpbHRlcnM7XG4gICAgICBjb25zdCBzdG9yYWdlSW5zdGFuY2UgPSBhd2FpdCB0aGlzLmxvYWRTdG9yYWdlKGNvbmZpZywgdGhpcy5sb2dnZXIpO1xuICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UgPSBuZXcgTG9jYWxTdG9yYWdlKHRoaXMuY29uZmlnLCBsb2dnZXIsIHN0b3JhZ2VJbnN0YW5jZSk7XG4gICAgICBhd2FpdCB0aGlzLmxvY2FsU3RvcmFnZS5nZXRTZWNyZXQoY29uZmlnKTtcbiAgICAgIGRlYnVnKCdpbml0aWFsaXphdGlvbiBjb21wbGV0ZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWcoJ3N0b3JhZ2UgaGFzIGJlZW4gYWxyZWFkeSBpbml0aWFsaXplZCcpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5maWx0ZXJzKSB7XG4gICAgICB0aGlzLmZpbHRlcnMgPSBhd2FpdCBhc3luY0xvYWRQbHVnaW48cGx1Z2luVXRpbHMuTWFuaWZlc3RGaWx0ZXI8dW5rbm93bj4+KFxuICAgICAgICB0aGlzLmNvbmZpZy5maWx0ZXJzLFxuICAgICAgICB7XG4gICAgICAgICAgY29uZmlnOiB0aGlzLmNvbmZpZyxcbiAgICAgICAgICBsb2dnZXI6IHRoaXMubG9nZ2VyLFxuICAgICAgICB9LFxuICAgICAgICAocGx1Z2luOiBwbHVnaW5VdGlscy5NYW5pZmVzdEZpbHRlcjxDb25maWc+KSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBwbHVnaW4uZmlsdGVyX21ldGFkYXRhICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgfSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdGhpcy5jb25maWc/LnNlcnZlclNldHRpbmdzPy5wbHVnaW5QcmVmaXgsXG4gICAgICAgIFBMVUdJTl9DQVRFR09SWS5GSUxURVJcbiAgICAgICk7XG4gICAgICBkZWJ1ZygnZmlsdGVycyBhdmFpbGFibGUgJW8nLCB0aGlzLmZpbHRlcnMubGVuZ3RoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGxvYWRTdG9yYWdlKGNvbmZpZzogQ29uZmlnLCBsb2dnZXI6IExvZ2dlcik6IFByb21pc2U8U3RvcmFnZVBsdWdpbj4ge1xuICAgIGNvbnN0IFN0b3JhZ2UgPSBhd2FpdCB0aGlzLmxvYWRTdG9yZVBsdWdpbigpO1xuICAgIGlmIChfLmlzTmlsKFN0b3JhZ2UpKSB7XG4gICAgICBhc3NlcnQodGhpcy5jb25maWcuc3RvcmFnZSwgJ0NPTkZJRzogc3RvcmFnZSBwYXRoIG5vdCBkZWZpbmVkJyk7XG4gICAgICBkZWJ1Zygnbm8gY3VzdG9tIHN0b3JhZ2UgZm91bmQsIGxvYWRpbmcgZGVmYXVsdCBzdG9yYWdlIEB2ZXJkYWNjaW8vbG9jYWwtc3RvcmFnZScpO1xuICAgICAgY29uc3QgbG9jYWxTdG9yYWdlID0gbmV3IExvY2FsRGF0YWJhc2VQbHVnaW4oY29uZmlnLCBsb2dnZXIpO1xuICAgICAgbG9nZ2VyLmluZm8oXG4gICAgICAgIHsgbmFtZTogJ0B2ZXJkYWNjaW8vbG9jYWwtc3RvcmFnZScsIHBsdWdpbkNhdGVnb3J5OiBQTFVHSU5fQ0FURUdPUlkuU1RPUkFHRSB9LFxuICAgICAgICAncGx1Z2luIEB7bmFtZX0gc3VjY2Vzc2Z1bGx5IGxvYWRlZCAoQHtwbHVnaW5DYXRlZ29yeX0pJ1xuICAgICAgKTtcbiAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2U7XG4gICAgfVxuICAgIHJldHVybiBTdG9yYWdlIGFzIFN0b3JhZ2VQbHVnaW47XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGxvYWRTdG9yZVBsdWdpbigpOiBQcm9taXNlPFN0b3JhZ2VQbHVnaW5MZWdhY3k8Q29uZmlnPiB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IHBsdWdpbnM6IFN0b3JhZ2VQbHVnaW5MZWdhY3k8Q29uZmlnPltdID0gYXdhaXQgYXN5bmNMb2FkUGx1Z2luPFxuICAgICAgcGx1Z2luVXRpbHMuU3RvcmFnZTx1bmtub3duPlxuICAgID4oXG4gICAgICB0aGlzLmNvbmZpZy5zdG9yZSxcbiAgICAgIHtcbiAgICAgICAgY29uZmlnOiB0aGlzLmNvbmZpZyxcbiAgICAgICAgbG9nZ2VyOiB0aGlzLmxvZ2dlcixcbiAgICAgIH0sXG4gICAgICAocGx1Z2luKSA9PiB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgcGx1Z2luLmdldFBhY2thZ2VTdG9yYWdlICE9PSAndW5kZWZpbmVkJztcbiAgICAgIH0sXG4gICAgICB0cnVlLFxuICAgICAgdGhpcy5jb25maWc/LnNlcnZlclNldHRpbmdzPy5wbHVnaW5QcmVmaXgsXG4gICAgICBQTFVHSU5fQ0FURUdPUlkuU1RPUkFHRVxuICAgICk7XG5cbiAgICBpZiAocGx1Z2lucy5sZW5ndGggPiAxKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKFxuICAgICAgICAnbW9yZSB0aGFuIG9uZSBzdG9yYWdlIHBsdWdpbnMgaGFzIGJlZW4gZGV0ZWN0ZWQsIG11bHRpcGxlIHN0b3JhZ2UgYXJlIG5vdCBzdXBwb3J0ZWQsIG9uZSB3aWxsIGJlIHNlbGVjdGVkIGF1dG9tYXRpY2FsbHknXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBfLmhlYWQocGx1Z2lucyk7XG4gIH1cblxuICAvKipcbiAgICogIEFkZCBhIHtuYW1lfSBwYWNrYWdlIHRvIGEgc3lzdGVtXG4gICBGdW5jdGlvbiBjaGVja3MgaWYgcGFja2FnZSB3aXRoIHRoZSBzYW1lIG5hbWUgaXMgYXZhaWxhYmxlIGZyb20gdXBsaW5rcy5cbiAgIElmIGl0IGlzbid0LCB3ZSBjcmVhdGUgcGFja2FnZSBsb2NhbGx5XG4gICBVc2VkIHN0b3JhZ2VzOiBsb2NhbCAod3JpdGUpICYmIHVwbGlua3NcbiAgICovXG4gIHB1YmxpYyBhc3luYyBhZGRQYWNrYWdlKG5hbWU6IHN0cmluZywgbWV0YWRhdGE6IGFueSwgY2FsbGJhY2s6IGFueSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBjaGVja1BhY2thZ2VMb2NhbChuYW1lLCB0aGlzLmxvY2FsU3RvcmFnZSk7XG4gICAgICBhd2FpdCBjaGVja1BhY2thZ2VSZW1vdGUoXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHRoaXMuX2lzQWxsb3dQdWJsaXNoT2ZmbGluZSgpLFxuICAgICAgICB0aGlzLl9zeW5jVXBsaW5rc01ldGFkYXRhLmJpbmQodGhpcylcbiAgICAgICk7XG4gICAgICBhd2FpdCBwdWJsaXNoUGFja2FnZShuYW1lLCBtZXRhZGF0YSwgdGhpcy5sb2NhbFN0b3JhZ2UpO1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9pc0FsbG93UHVibGlzaE9mZmxpbmUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHR5cGVvZiB0aGlzLmNvbmZpZy5wdWJsaXNoICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgXy5pc0Jvb2xlYW4odGhpcy5jb25maWcucHVibGlzaC5hbGxvd19vZmZsaW5lKSAmJlxuICAgICAgdGhpcy5jb25maWcucHVibGlzaC5hbGxvd19vZmZsaW5lXG4gICAgKTtcbiAgfVxuXG4gIHB1YmxpYyByZWFkVG9rZW5zKGZpbHRlcjogVG9rZW5GaWx0ZXIpOiBQcm9taXNlPFRva2VuW10+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbFN0b3JhZ2UucmVhZFRva2VucyhmaWx0ZXIpO1xuICB9XG5cbiAgcHVibGljIHNhdmVUb2tlbih0b2tlbjogVG9rZW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5sb2NhbFN0b3JhZ2Uuc2F2ZVRva2VuKHRva2VuKTtcbiAgfVxuXG4gIHB1YmxpYyBkZWxldGVUb2tlbih1c2VyOiBzdHJpbmcsIHRva2VuS2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLmxvY2FsU3RvcmFnZS5kZWxldGVUb2tlbih1c2VyLCB0b2tlbktleSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3IHZlcnNpb24gb2YgcGFja2FnZSB7bmFtZX0gdG8gYSBzeXN0ZW1cbiAgIFVzZWQgc3RvcmFnZXM6IGxvY2FsICh3cml0ZSlcbiAgICovXG4gIHB1YmxpYyBhZGRWZXJzaW9uKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG4gICAgbWV0YWRhdGE6IFZlcnNpb24sXG4gICAgdGFnOiBTdHJpbmdWYWx1ZSxcbiAgICBjYWxsYmFjazogQ2FsbGJhY2tcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5sb2NhbFN0b3JhZ2UuYWRkVmVyc2lvbihuYW1lLCB2ZXJzaW9uLCBtZXRhZGF0YSwgdGFnLCBjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogVGFncyBhIHBhY2thZ2UgdmVyc2lvbiB3aXRoIGEgcHJvdmlkZWQgdGFnXG4gICBVc2VkIHN0b3JhZ2VzOiBsb2NhbCAod3JpdGUpXG4gICAqL1xuICBwdWJsaWMgbWVyZ2VUYWdzKG5hbWU6IHN0cmluZywgdGFnSGFzaDogTWVyZ2VUYWdzLCBjYWxsYmFjazogQ2FsbGJhY2spOiB2b2lkIHtcbiAgICB0aGlzLmxvY2FsU3RvcmFnZS5tZXJnZVRhZ3MobmFtZSwgdGFnSGFzaCwgY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSBhbiBleGlzdGluZyBwYWNrYWdlIChpLmUuIHVucHVibGlzaCBvbmUgdmVyc2lvbilcbiAgIEZ1bmN0aW9uIGNoYW5nZXMgYSBwYWNrYWdlIGluZm8gZnJvbSBsb2NhbCBzdG9yYWdlIGFuZCBhbGwgdXBsaW5rcyB3aXRoIHdyaXRlIGFjY2Vzcy4vXG4gICBVc2VkIHN0b3JhZ2VzOiBsb2NhbCAod3JpdGUpXG4gICAqL1xuICBwdWJsaWMgY2hhbmdlUGFja2FnZShcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgbWV0YWRhdGE6IFBhY2thZ2UsXG4gICAgcmV2aXNpb246IHN0cmluZyxcbiAgICBjYWxsYmFjazogQ2FsbGJhY2tcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5sb2NhbFN0b3JhZ2UuY2hhbmdlUGFja2FnZShuYW1lLCBtZXRhZGF0YSwgcmV2aXNpb24sIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBwYWNrYWdlIGZyb20gYSBzeXN0ZW1cbiAgIEZ1bmN0aW9uIHJlbW92ZXMgYSBwYWNrYWdlIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgVXNlZCBzdG9yYWdlczogbG9jYWwgKHdyaXRlKVxuICAgKi9cbiAgcHVibGljIHJlbW92ZVBhY2thZ2UobmFtZTogc3RyaW5nLCBjYWxsYmFjazogQ2FsbGJhY2spOiB2b2lkIHtcbiAgICB0aGlzLmxvY2FsU3RvcmFnZS5yZW1vdmVQYWNrYWdlKG5hbWUsIGNhbGxiYWNrKTtcbiAgICAvLyB1cGRhdGUgdGhlIGluZGV4ZXJcbiAgICBTZWFyY2hNZW1vcnlJbmRleGVyLnJlbW92ZShuYW1lKS5jYXRjaCgocmVhc29uKSA9PiB7XG4gICAgICBkZWJ1ZygnaW5kZXhlciBoYXMgZmFpbGVkIG9uIHJlbW92ZSBpdGVtICVvJywgcmVhc29uKTtcbiAgICAgIGxvZ2dlci5lcnJvcignaW5kZXhlciBoYXMgZmFpbGVkIG9uIHJlbW92ZSBpdGVtJyk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgIFJlbW92ZSBhIHRhcmJhbGwgZnJvbSBhIHN5c3RlbVxuICAgRnVuY3Rpb24gcmVtb3ZlcyBhIHRhcmJhbGwgZnJvbSBsb2NhbCBzdG9yYWdlLlxuICAgVGFyYmFsbCBpbiBxdWVzdGlvbiBzaG91bGQgbm90IGJlIGxpbmtlZCB0byBpbiBhbnkgZXhpc3RpbmdcbiAgIHZlcnNpb25zLCBpLmUuIHBhY2thZ2UgdmVyc2lvbiBzaG91bGQgYmUgdW5wdWJsaXNoZWQgZmlyc3QuXG4gICBVc2VkIHN0b3JhZ2U6IGxvY2FsICh3cml0ZSlcbiAgICovXG4gIHB1YmxpYyByZW1vdmVUYXJiYWxsKG5hbWU6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZywgcmV2aXNpb246IHN0cmluZywgY2FsbGJhY2s6IENhbGxiYWNrKTogdm9pZCB7XG4gICAgdGhpcy5sb2NhbFN0b3JhZ2UucmVtb3ZlVGFyYmFsbChuYW1lLCBmaWxlbmFtZSwgcmV2aXNpb24sIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGxvYWQgYSB0YXJiYWxsIGZvciB7bmFtZX0gcGFja2FnZVxuICAgRnVuY3Rpb24gaXMgc3luY2hyb25vdXMgYW5kIHJldHVybnMgYSBXcml0YWJsZVN0cmVhbVxuICAgVXNlZCBzdG9yYWdlczogbG9jYWwgKHdyaXRlKVxuICAgKi9cbiAgcHVibGljIGFkZFRhcmJhbGwobmFtZTogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMubG9jYWxTdG9yYWdlLmFkZFRhcmJhbGwobmFtZSwgZmlsZW5hbWUpO1xuICB9XG5cbiAgcHVibGljIGhhc0xvY2FsVGFyYmFsbChuYW1lOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUsIHJlamVjdCk6IHZvaWQgPT4ge1xuICAgICAgbGV0IGxvY2FsU3RyZWFtOiBhbnkgPSBzZWxmLmxvY2FsU3RvcmFnZS5nZXRUYXJiYWxsKG5hbWUsIGZpbGVuYW1lKTtcbiAgICAgIGxldCBpc09wZW4gPSBmYWxzZTtcbiAgICAgIGxvY2FsU3RyZWFtLm9uKCdlcnJvcicsIChlcnIpOiBhbnkgPT4ge1xuICAgICAgICBpZiAoaXNPcGVuIHx8IGVyci5zdGF0dXMgIT09IEhUVFBfU1RBVFVTLk5PVF9GT1VORCkge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvY2FsIHJlcG9ydGVkIDQwNCBvciByZXF1ZXN0IHdhcyBhYm9ydGVkIGFscmVhZHlcbiAgICAgICAgaWYgKGxvY2FsU3RyZWFtKSB7XG4gICAgICAgICAgbG9jYWxTdHJlYW0uYWJvcnQoKTtcbiAgICAgICAgICBsb2NhbFN0cmVhbSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZShmYWxzZSk7XG4gICAgICB9KTtcbiAgICAgIGxvY2FsU3RyZWFtLm9uKCdvcGVuJywgZnVuY3Rpb24gKCk6IHZvaWQge1xuICAgICAgICBpc09wZW4gPSB0cnVlO1xuICAgICAgICBsb2NhbFN0cmVhbS5hYm9ydCgpO1xuICAgICAgICBsb2NhbFN0cmVhbSA9IG51bGw7XG4gICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgR2V0IGEgdGFyYmFsbCBmcm9tIGEgc3RvcmFnZSBmb3Ige25hbWV9IHBhY2thZ2VcbiAgIEZ1bmN0aW9uIGlzIHN5bmNocm9ub3VzIGFuZCByZXR1cm5zIGEgUmVhZGFibGVTdHJlYW1cbiAgIEZ1bmN0aW9uIHRyaWVzIHRvIHJlYWQgdGFyYmFsbCBsb2NhbGx5LCBpZiBpdCBmYWlscyB0aGVuIGl0IHJlYWRzIHBhY2thZ2VcbiAgIGluZm9ybWF0aW9uIGluIG9yZGVyIHRvIGZpZ3VyZSBvdXQgd2hlcmUgd2UgY2FuIGdldCB0aGlzIHRhcmJhbGwgZnJvbVxuICAgVXNlZCBzdG9yYWdlczogbG9jYWwgfHwgdXBsaW5rIChqdXN0IG9uZSlcbiAgICovXG4gIHB1YmxpYyBnZXRUYXJiYWxsKG5hbWU6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IHJlYWRTdHJlYW0gPSBuZXcgUmVhZFRhcmJhbGwoe30pO1xuICAgIHJlYWRTdHJlYW0uYWJvcnQgPSBmdW5jdGlvbiAoKSB7fTtcblxuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gaWYgc29tZW9uZSByZXF1ZXN0aW5nIHRhcmJhbGwsIGl0IG1lYW5zIHRoYXQgd2Ugc2hvdWxkIGFscmVhZHkgaGF2ZSBzb21lXG4gICAgLy8gaW5mb3JtYXRpb24gYWJvdXQgaXQsIHNvIGZldGNoaW5nIHBhY2thZ2UgaW5mbyBpcyB1bm5lY2Vzc2FyeVxuXG4gICAgLy8gdHJ5aW5nIGxvY2FsIGZpcnN0XG4gICAgLy8gZmxvdzogc2hvdWxkIGJlIElSZWFkVGFyYmFsbFxuICAgIGxldCBsb2NhbFN0cmVhbTogYW55ID0gc2VsZi5sb2NhbFN0b3JhZ2UuZ2V0VGFyYmFsbChuYW1lLCBmaWxlbmFtZSk7XG4gICAgbGV0IGlzT3BlbiA9IGZhbHNlO1xuICAgIGxvY2FsU3RyZWFtLm9uKCdlcnJvcicsIChlcnIpOiBhbnkgPT4ge1xuICAgICAgaWYgKGlzT3BlbiB8fCBlcnIuc3RhdHVzICE9PSBIVFRQX1NUQVRVUy5OT1RfRk9VTkQpIHtcbiAgICAgICAgcmV0dXJuIHJlYWRTdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgfVxuXG4gICAgICAvLyBsb2NhbCByZXBvcnRlZCA0MDRcbiAgICAgIGNvbnN0IGVycjQwNCA9IGVycjtcbiAgICAgIGxvY2FsU3RyZWFtLmFib3J0KCk7XG4gICAgICBsb2NhbFN0cmVhbSA9IG51bGw7IC8vIHdlIGZvcmNlIGZvciBnYXJiYWdlIGNvbGxlY3RvclxuICAgICAgc2VsZi5sb2NhbFN0b3JhZ2UuZ2V0UGFja2FnZU1ldGFkYXRhKG5hbWUsIChlcnIsIGluZm86IFBhY2thZ2UpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKF8uaXNOaWwoZXJyKSAmJiBpbmZvLl9kaXN0ZmlsZXMgJiYgXy5pc05pbChpbmZvLl9kaXN0ZmlsZXNbZmlsZW5hbWVdKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAvLyBpbmZvcm1hdGlvbiBhYm91dCB0aGlzIGZpbGUgZXhpc3RzIGxvY2FsbHlcbiAgICAgICAgICBzZXJ2ZUZpbGUoaW5mby5fZGlzdGZpbGVzW2ZpbGVuYW1lXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gd2Uga25vdyBub3RoaW5nIGFib3V0IHRoaXMgZmlsZSwgdHJ5aW5nIHRvIGdldCBpbmZvcm1hdGlvbiBlbHNld2hlcmVcbiAgICAgICAgICBzZWxmLl9zeW5jVXBsaW5rc01ldGFkYXRhKG5hbWUsIGluZm8sIHt9LCAoZXJyLCBpbmZvOiBQYWNrYWdlKTogYW55ID0+IHtcbiAgICAgICAgICAgIGlmIChfLmlzTmlsKGVycikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZWFkU3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChfLmlzTmlsKGluZm8uX2Rpc3RmaWxlcykgfHwgXy5pc05pbChpbmZvLl9kaXN0ZmlsZXNbZmlsZW5hbWVdKSkge1xuICAgICAgICAgICAgICByZXR1cm4gcmVhZFN0cmVhbS5lbWl0KCdlcnJvcicsIGVycjQwNCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXJ2ZUZpbGUoaW5mby5fZGlzdGZpbGVzW2ZpbGVuYW1lXSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGxvY2FsU3RyZWFtLm9uKCdjb250ZW50LWxlbmd0aCcsIGZ1bmN0aW9uICh2KTogdm9pZCB7XG4gICAgICByZWFkU3RyZWFtLmVtaXQoJ2NvbnRlbnQtbGVuZ3RoJywgdik7XG4gICAgfSk7XG4gICAgbG9jYWxTdHJlYW0ub24oJ29wZW4nLCBmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAgICBpc09wZW4gPSB0cnVlO1xuICAgICAgbG9jYWxTdHJlYW0ucGlwZShyZWFkU3RyZWFtKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVhZFN0cmVhbTtcblxuICAgIC8qKlxuICAgICAqIEZldGNoIGFuZCBjYWNoZSBsb2NhbC9yZW1vdGUgcGFja2FnZXMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGZpbGUgZGVmaW5lIHRoZSBwYWNrYWdlIHNoYXBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gc2VydmVGaWxlKGZpbGU6IERpc3RGaWxlKTogdm9pZCB7XG4gICAgICBsZXQgdXBsaW5rOiBhbnkgPSBudWxsO1xuXG4gICAgICBmb3IgKGNvbnN0IHVwbGlua0lkIGluIHNlbGYudXBsaW5rcykge1xuICAgICAgICBpZiAoaGFzUHJveHlUbyhuYW1lLCB1cGxpbmtJZCwgc2VsZi5jb25maWcucGFja2FnZXMpKSB7XG4gICAgICAgICAgdXBsaW5rID0gc2VsZi51cGxpbmtzW3VwbGlua0lkXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodXBsaW5rID09IG51bGwpIHtcbiAgICAgICAgdXBsaW5rID0gbmV3IFByb3h5U3RvcmFnZShcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1cmw6IGZpbGUudXJsLFxuICAgICAgICAgICAgY2FjaGU6IHRydWUsXG4gICAgICAgICAgICBfYXV0b2dlbmVyYXRlZDogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNlbGYuY29uZmlnXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzYXZlc3RyZWFtOiBhbnkgPSBudWxsO1xuICAgICAgaWYgKHVwbGluay5jb25maWcuY2FjaGUpIHtcbiAgICAgICAgc2F2ZXN0cmVhbSA9IHNlbGYubG9jYWxTdG9yYWdlLmFkZFRhcmJhbGwobmFtZSwgZmlsZW5hbWUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgb25fb3BlbiA9IGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAgICAgICAgLy8gcHJldmVudCBpdCBmcm9tIGJlaW5nIGNhbGxlZCB0d2ljZVxuICAgICAgICBvbl9vcGVuID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgIGNvbnN0IHJzdHJlYW0yID0gdXBsaW5rLmZldGNoVGFyYmFsbChmaWxlLnVybCk7XG4gICAgICAgIHJzdHJlYW0yLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpOiB2b2lkIHtcbiAgICAgICAgICBpZiAoc2F2ZXN0cmVhbSkge1xuICAgICAgICAgICAgc2F2ZXN0cmVhbS5hYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzYXZlc3RyZWFtID0gbnVsbDtcbiAgICAgICAgICByZWFkU3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJzdHJlYW0yLm9uKCdlbmQnLCBmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAgICAgICAgaWYgKHNhdmVzdHJlYW0pIHtcbiAgICAgICAgICAgIHNhdmVzdHJlYW0uZG9uZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcnN0cmVhbTIub24oJ2NvbnRlbnQtbGVuZ3RoJywgZnVuY3Rpb24gKHYpOiB2b2lkIHtcbiAgICAgICAgICByZWFkU3RyZWFtLmVtaXQoJ2NvbnRlbnQtbGVuZ3RoJywgdik7XG4gICAgICAgICAgaWYgKHNhdmVzdHJlYW0pIHtcbiAgICAgICAgICAgIHNhdmVzdHJlYW0uZW1pdCgnY29udGVudC1sZW5ndGgnLCB2KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByc3RyZWFtMi5waXBlKHJlYWRTdHJlYW0pO1xuICAgICAgICBpZiAoc2F2ZXN0cmVhbSkge1xuICAgICAgICAgIHJzdHJlYW0yLnBpcGUoc2F2ZXN0cmVhbSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGlmIChzYXZlc3RyZWFtKSB7XG4gICAgICAgIHNhdmVzdHJlYW0ub24oJ29wZW4nLCBmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAgICAgICAgb25fb3BlbigpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzYXZlc3RyZWFtLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpOiB2b2lkIHtcbiAgICAgICAgICBzZWxmLmxvZ2dlci53YXJuKFxuICAgICAgICAgICAgeyBlcnI6IGVyciwgZmlsZU5hbWU6IGZpbGUgfSxcbiAgICAgICAgICAgICdlcnJvciBzYXZpbmcgZmlsZSBAe2ZpbGVOYW1lfTogQHtlcnIubWVzc2FnZX1cXG5Ae2Vyci5zdGFja30nXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAoc2F2ZXN0cmVhbSkge1xuICAgICAgICAgICAgc2F2ZXN0cmVhbS5hYm9ydCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzYXZlc3RyZWFtID0gbnVsbDtcbiAgICAgICAgICBvbl9vcGVuKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb25fb3BlbigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgUmV0cmlldmUgYSBwYWNrYWdlIG1ldGFkYXRhIGZvciB7bmFtZX0gcGFja2FnZVxuICAgRnVuY3Rpb24gaW52b2tlcyBsb2NhbFN0b3JhZ2UuZ2V0UGFja2FnZSBhbmQgdXBsaW5rLmdldF9wYWNrYWdlIGZvciBldmVyeVxuICAgdXBsaW5rIHdpdGggcHJveHlfYWNjZXNzIHJpZ2h0cyBhZ2FpbnN0IHtuYW1lfSBhbmQgY29tYmluZXMgcmVzdWx0c1xuICAgaW50byBvbmUganNvbiBvYmplY3RcbiAgIFVzZWQgc3RvcmFnZXM6IGxvY2FsICYmIHVwbGluayAocHJveHlfYWNjZXNzKVxuXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBvcHRpb25zLm5hbWUgUGFja2FnZSBOYW1lXG4gICAqIEBwcm9wZXJ0eSB7b2JqZWN0fSAgb3B0aW9ucy5yZXEgRXhwcmVzcyBgcmVxYCBvYmplY3RcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBvcHRpb25zLmtlZXBVcExpbmtEYXRhIGtlZXAgdXAgbGluayBpbmZvIGluIHBhY2thZ2UgbWV0YSwgbGFzdCB1cGRhdGUsIGV0Yy5cbiAgICogQHByb3BlcnR5IHtmdW5jdGlvbn0gb3B0aW9ucy5jYWxsYmFjayBDYWxsYmFjayBmb3IgcmVjZWl2ZSBkYXRhXG4gICAqL1xuICBwdWJsaWMgZ2V0UGFja2FnZShvcHRpb25zKTogdm9pZCB7XG4gICAgdGhpcy5sb2NhbFN0b3JhZ2UuZ2V0UGFja2FnZU1ldGFkYXRhKG9wdGlvbnMubmFtZSwgKGVyciwgZGF0YSk6IHZvaWQgPT4ge1xuICAgICAgaWYgKGVyciAmJiAoIWVyci5zdGF0dXMgfHwgZXJyLnN0YXR1cyA+PSBIVFRQX1NUQVRVUy5JTlRFUk5BTF9FUlJPUikpIHtcbiAgICAgICAgLy8gcmVwb3J0IGludGVybmFsIGVycm9ycyByaWdodCBhd2F5XG4gICAgICAgIHJldHVybiBvcHRpb25zLmNhbGxiYWNrKGVycik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3N5bmNVcGxpbmtzTWV0YWRhdGEoXG4gICAgICAgIG9wdGlvbnMubmFtZSxcbiAgICAgICAgZGF0YSxcbiAgICAgICAgeyByZXE6IG9wdGlvbnMucmVxLCB1cGxpbmtzTG9vazogb3B0aW9ucy51cGxpbmtzTG9vayB9LFxuICAgICAgICBmdW5jdGlvbiBnZXRQYWNrYWdlU3luVXBMaW5rc0NhbGxiYWNrKGVyciwgcmVzdWx0OiBQYWNrYWdlLCB1cGxpbmtFcnJvcnMpOiB2b2lkIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5jYWxsYmFjayhlcnIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG5vcm1hbGl6ZURpc3RUYWdzKGNsZWFuVXBMaW5rc1JlZihvcHRpb25zLmtlZXBVcExpbmtEYXRhLCByZXN1bHQpKTtcblxuICAgICAgICAgIC8vIG5wbSBjYW4gdGhyb3cgaWYgdGhpcyBmaWVsZCBkb2Vzbid0IGV4aXN0XG4gICAgICAgICAgcmVzdWx0Ll9hdHRhY2htZW50cyA9IHt9O1xuICAgICAgICAgIGlmIChvcHRpb25zLmFiYnJldmlhdGVkID09PSB0cnVlKSB7XG4gICAgICAgICAgICBvcHRpb25zLmNhbGxiYWNrKG51bGwsIGNvbnZlcnRBYmJyZXZpYXRlZE1hbmlmZXN0KHJlc3VsdCksIHVwbGlua0Vycm9ycyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdGlvbnMuY2FsbGJhY2sobnVsbCwgcmVzdWx0LCB1cGxpbmtFcnJvcnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgUmV0cmlldmUgcmVtb3RlIGFuZCBsb2NhbCBwYWNrYWdlcyBtb3JlIHJlY2VudCB0aGFuIHtzdGFydGtleX1cbiAgIEZ1bmN0aW9uIHN0cmVhbXMgYWxsIHBhY2thZ2VzIGZyb20gYWxsIHVwbGlua3MgZmlyc3QsIGFuZCB0aGVuXG4gICBsb2NhbCBwYWNrYWdlcy5cbiAgIE5vdGUgdGhhdCBsb2NhbCBwYWNrYWdlcyBjb3VsZCBvdmVycmlkZSByZWdpc3RyeSBvbmVzIGp1c3QgYmVjYXVzZVxuICAgdGhleSBhcHBlYXIgaW4gSlNPTiBsYXN0LiBUaGF0J3MgYSB0cmFkZS1vZmYgd2UgbWFrZSB0byBhdm9pZFxuICAgbWVtb3J5IGlzc3Vlcy5cbiAgIFVzZWQgc3RvcmFnZXM6IGxvY2FsICYmIHVwbGluayAocHJveHlfYWNjZXNzKVxuICAgKiBAcGFyYW0geyp9IHN0YXJ0a2V5XG4gICAqIEBwYXJhbSB7Kn0gb3B0aW9uc1xuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBwdWJsaWMgc2VhcmNoKHN0YXJ0a2V5OiBzdHJpbmcsIG9wdGlvbnM6IGFueSkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGNvbnN0IHNlYXJjaFN0cmVhbTogYW55ID0gbmV3IFN0cmVhbS5QYXNzVGhyb3VnaCh7IG9iamVjdE1vZGU6IHRydWUgfSk7XG4gICAgYXN5bmMuZWFjaFNlcmllcyhcbiAgICAgIE9iamVjdC5rZXlzKHRoaXMudXBsaW5rcyksXG4gICAgICBmdW5jdGlvbiAodXBfbmFtZSwgY2IpOiB2b2lkIHtcbiAgICAgICAgLy8gc2hvcnRjdXQ6IGlmIGBsb2NhbD0xYCBpcyBzdXBwbGllZCwgZG9uJ3QgY2FsbCB1cGxpbmtzXG4gICAgICAgIGlmIChvcHRpb25zLnJlcT8ucXVlcnk/LmxvY2FsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gY2IoKTtcbiAgICAgICAgfVxuICAgICAgICBsb2dnZXIuaW5mbyhgc2VhcmNoIGZvciB1cGxpbmsgJHt1cF9uYW1lfWApO1xuICAgICAgICAvLyBzZWFyY2ggYnkga2V5d29yZCBmb3IgZWFjaCB1cGxpbmtcbiAgICAgICAgY29uc3QgdXBsaW5rU3RyZWFtID0gc2VsZi51cGxpbmtzW3VwX25hbWVdLnNlYXJjaChvcHRpb25zKTtcbiAgICAgICAgLy8gam9pbiB1cGxpbmsgc3RyZWFtIHdpdGggc3RyZWFtcyBQYXNzVGhyb3VnaFxuICAgICAgICB1cGxpbmtTdHJlYW0ucGlwZShzZWFyY2hTdHJlYW0sIHsgZW5kOiBmYWxzZSB9KTtcbiAgICAgICAgdXBsaW5rU3RyZWFtLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpOiB2b2lkIHtcbiAgICAgICAgICBzZWxmLmxvZ2dlci5lcnJvcih7IGVycjogZXJyIH0sICd1cGxpbmsgZXJyb3I6IEB7ZXJyLm1lc3NhZ2V9Jyk7XG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgICAvLyB0byBhdm9pZCBjYWxsIGNhbGxiYWNrIG1vcmUgdGhhbiBvbmNlXG4gICAgICAgICAgY2IgPSBmdW5jdGlvbiAoKTogdm9pZCB7fTtcbiAgICAgICAgfSk7XG4gICAgICAgIHVwbGlua1N0cmVhbS5vbignZW5kJywgZnVuY3Rpb24gKCk6IHZvaWQge1xuICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgLy8gdG8gYXZvaWQgY2FsbCBjYWxsYmFjayBtb3JlIHRoYW4gb25jZVxuICAgICAgICAgIGNiID0gZnVuY3Rpb24gKCk6IHZvaWQge307XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlYXJjaFN0cmVhbS5hYm9ydCA9IGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAgICAgICAgICBpZiAodXBsaW5rU3RyZWFtLmFib3J0KSB7XG4gICAgICAgICAgICB1cGxpbmtTdHJlYW0uYWJvcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgICAvLyB0byBhdm9pZCBjYWxsIGNhbGxiYWNrIG1vcmUgdGhhbiBvbmNlXG4gICAgICAgICAgY2IgPSBmdW5jdGlvbiAoKTogdm9pZCB7fTtcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICAvLyBleGVjdXRlZCBhZnRlciBhbGwgc2VyaWVzXG4gICAgICBmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAgICAgIC8vIGF0dGFjaCBhIGxvY2FsIHNlYXJjaCByZXN1bHRzXG4gICAgICAgIGNvbnN0IGxvY2FsU2VhcmNoU3RyZWFtID0gc2VsZi5sb2NhbFN0b3JhZ2Uuc2VhcmNoKHN0YXJ0a2V5LCBvcHRpb25zKTtcbiAgICAgICAgc2VhcmNoU3RyZWFtLmFib3J0ID0gZnVuY3Rpb24gKCk6IHZvaWQge1xuICAgICAgICAgIGxvY2FsU2VhcmNoU3RyZWFtLmFib3J0KCk7XG4gICAgICAgIH07XG4gICAgICAgIGxvY2FsU2VhcmNoU3RyZWFtLnBpcGUoc2VhcmNoU3RyZWFtLCB7IGVuZDogdHJ1ZSB9KTtcbiAgICAgICAgbG9jYWxTZWFyY2hTdHJlYW0ub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycjogYW55KTogdm9pZCB7XG4gICAgICAgICAgc2VsZi5sb2dnZXIuZXJyb3IoeyBlcnI6IGVyciB9LCAnc2VhcmNoIGVycm9yOiBAe2Vyci5tZXNzYWdlfScpO1xuICAgICAgICAgIHNlYXJjaFN0cmVhbS5lbmQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiBzZWFyY2hTdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgb25seSBwcml2YXRlIGxvY2FsIHBhY2thZ2VzXG4gICAqIEBwYXJhbSB7Kn0gY2FsbGJhY2tcbiAgICovXG4gIHB1YmxpYyBnZXRMb2NhbERhdGFiYXNlKGNhbGxiYWNrOiBDYWxsYmFjayk6IHZvaWQge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIHRoaXMubG9jYWxTdG9yYWdlLnN0b3JhZ2VQbHVnaW4uZ2V0KChlcnIsIGxvY2Fscyk6IHZvaWQgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwYWNrYWdlczogVmVyc2lvbltdID0gW107XG4gICAgICBjb25zdCBnZXRQYWNrYWdlID0gZnVuY3Rpb24gKGl0ZW1Qa2cpOiB2b2lkIHtcbiAgICAgICAgc2VsZi5sb2NhbFN0b3JhZ2UuZ2V0UGFja2FnZU1ldGFkYXRhKFxuICAgICAgICAgIGxvY2Fsc1tpdGVtUGtnXSxcbiAgICAgICAgICBmdW5jdGlvbiAoZXJyLCBwa2dNZXRhZGF0YTogUGFja2FnZSk6IHZvaWQge1xuICAgICAgICAgICAgaWYgKF8uaXNOaWwoZXJyKSkge1xuICAgICAgICAgICAgICBjb25zdCBsYXRlc3QgPSBwa2dNZXRhZGF0YVtESVNUX1RBR1NdLmxhdGVzdDtcbiAgICAgICAgICAgICAgaWYgKGxhdGVzdCAmJiBwa2dNZXRhZGF0YS52ZXJzaW9uc1tsYXRlc3RdKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmVyc2lvbjogVmVyc2lvbiA9IHBrZ01ldGFkYXRhLnZlcnNpb25zW2xhdGVzdF07XG4gICAgICAgICAgICAgICAgY29uc3QgdGltZUxpc3QgPSBwa2dNZXRhZGF0YS50aW1lIGFzIEdlbmVyaWNCb2R5O1xuICAgICAgICAgICAgICAgIGNvbnN0IHRpbWUgPSB0aW1lTGlzdFtsYXRlc3RdO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICB2ZXJzaW9uLnRpbWUgPSB0aW1lO1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIGZvciBzdGFycyBhcGlcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgdmVyc2lvbi51c2VycyA9IHBrZ01ldGFkYXRhLnVzZXJzO1xuXG4gICAgICAgICAgICAgICAgcGFja2FnZXMucHVzaCh2ZXJzaW9uKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmxvZ2dlci53YXJuKFxuICAgICAgICAgICAgICAgICAgeyBwYWNrYWdlOiBsb2NhbHNbaXRlbVBrZ10gfSxcbiAgICAgICAgICAgICAgICAgICdwYWNrYWdlIEB7cGFja2FnZX0gZG9lcyBub3QgaGF2ZSBhIFwibGF0ZXN0XCIgdGFnPydcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpdGVtUGtnID49IGxvY2Fscy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHBhY2thZ2VzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGdldFBhY2thZ2UoaXRlbVBrZyArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH07XG5cbiAgICAgIGlmIChsb2NhbHMubGVuZ3RoKSB7XG4gICAgICAgIGdldFBhY2thZ2UoMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayhudWxsLCBbXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRnVuY3Rpb24gZmV0Y2hlcyBwYWNrYWdlIG1ldGFkYXRhIGZyb20gdXBsaW5rcyBhbmQgc3luY2hyb25pemVzIGl0IHdpdGggbG9jYWwgZGF0YVxuICAgaWYgcGFja2FnZSBpcyBhdmFpbGFibGUgbG9jYWxseSwgaXQgTVVTVCBiZSBwcm92aWRlZCBpbiBwa2dpbmZvXG4gICByZXR1cm5zIGNhbGxiYWNrKGVyciwgcmVzdWx0LCB1cGxpbmtfZXJyb3JzKVxuICAgKi9cbiAgcHVibGljIF9zeW5jVXBsaW5rc01ldGFkYXRhKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwYWNrYWdlSW5mbzogTWFuaWZlc3QsXG4gICAgb3B0aW9uczogSVN5bmNVcGxpbmtzLFxuICAgIGNhbGxiYWNrOiBDYWxsYmFja1xuICApOiB2b2lkIHtcbiAgICBsZXQgZm91bmQgPSB0cnVlO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGNvbnN0IHVwTGlua3M6IFByb3h5U3RvcmFnZVtdID0gW107XG4gICAgY29uc3QgaGFzVG9Mb29rSW50b1VwbGlua3MgPSBfLmlzTmlsKG9wdGlvbnMudXBsaW5rc0xvb2spIHx8IG9wdGlvbnMudXBsaW5rc0xvb2s7XG5cbiAgICBpZiAoIXBhY2thZ2VJbmZvKSB7XG4gICAgICBmb3VuZCA9IGZhbHNlO1xuICAgICAgcGFja2FnZUluZm8gPSBnZW5lcmF0ZVBhY2thZ2VUZW1wbGF0ZShuYW1lKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHVwbGluayBpbiB0aGlzLnVwbGlua3MpIHtcbiAgICAgIGlmIChoYXNQcm94eVRvKG5hbWUsIHVwbGluaywgdGhpcy5jb25maWcucGFja2FnZXMpICYmIGhhc1RvTG9va0ludG9VcGxpbmtzKSB7XG4gICAgICAgIHVwTGlua3MucHVzaCh0aGlzLnVwbGlua3NbdXBsaW5rXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMubWFwKFxuICAgICAgdXBMaW5rcyxcbiAgICAgICh1cExpbms6IFByb3h5U3RvcmFnZSwgY2IpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgX29wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zKTtcbiAgICAgICAgY29uc3QgdXBMaW5rTWV0YSA9IHBhY2thZ2VJbmZvLl91cGxpbmtzW3VwTGluay51cG5hbWVdO1xuXG4gICAgICAgIGlmIChpc09iamVjdCh1cExpbmtNZXRhKSkge1xuICAgICAgICAgIGNvbnN0IGZldGNoZWQgPSB1cExpbmtNZXRhLmZldGNoZWQ7XG5cbiAgICAgICAgICBpZiAoZmV0Y2hlZCAmJiBEYXRlLm5vdygpIC0gZmV0Y2hlZCA8IHVwTGluay5tYXhhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBjYigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF9vcHRpb25zLmV0YWcgPSB1cExpbmtNZXRhLmV0YWc7XG4gICAgICAgIH1cblxuICAgICAgICB1cExpbmsuZ2V0UmVtb3RlTWV0YWRhdGEobmFtZSwgX29wdGlvbnMsIChlcnIsIHVwTGlua1Jlc3BvbnNlLCBlVGFnKTogdm9pZCA9PiB7XG4gICAgICAgICAgaWYgKGVyciAmJiBlcnIucmVtb3RlU3RhdHVzID09PSAzMDQpIHtcbiAgICAgICAgICAgIHVwTGlua01ldGEuZmV0Y2hlZCA9IERhdGUubm93KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGVyciB8fCAhdXBMaW5rUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBjYihudWxsLCBbZXJyIHx8IEVycm9yQ29kZS5nZXRJbnRlcm5hbEVycm9yKCdubyBkYXRhJyldKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdXBMaW5rUmVzcG9uc2UgPSB2YWxpZGF0aW9uVXRpbHMubm9ybWFsaXplTWV0YWRhdGEodXBMaW5rUmVzcG9uc2UsIG5hbWUpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgc2VsZi5sb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzdWI6ICdvdXQnLFxuICAgICAgICAgICAgICAgIGVycjogZXJyLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAncGFja2FnZS5qc29uIHZhbGlkYXRpbmcgZXJyb3IgQHshZXJyLm1lc3NhZ2V9XFxuQHtlcnIuc3RhY2t9J1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBjYihudWxsLCBbZXJyXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGFja2FnZUluZm8uX3VwbGlua3NbdXBMaW5rLnVwbmFtZV0gPSB7XG4gICAgICAgICAgICBldGFnOiBlVGFnLFxuICAgICAgICAgICAgZmV0Y2hlZDogRGF0ZS5ub3coKSxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgcGFja2FnZUluZm8gPSBtZXJnZVVwbGlua1RpbWVJbnRvTG9jYWwocGFja2FnZUluZm8sIHVwTGlua1Jlc3BvbnNlKTtcblxuICAgICAgICAgIHVwZGF0ZVZlcnNpb25zSGlkZGVuVXBMaW5rKHVwTGlua1Jlc3BvbnNlLnZlcnNpb25zLCB1cExpbmspO1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG1lcmdlVmVyc2lvbnMocGFja2FnZUluZm8sIHVwTGlua1Jlc3BvbnNlKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHNlbGYubG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3ViOiAnb3V0JyxcbiAgICAgICAgICAgICAgICBlcnI6IGVycixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgJ3BhY2thZ2UuanNvbiBwYXJzaW5nIGVycm9yIEB7IWVyci5tZXNzYWdlfVxcbkB7ZXJyLnN0YWNrfSdcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gY2IobnVsbCwgW2Vycl0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIGlmIHdlIGdvdCB0byB0aGlzIHBvaW50LCBhc3N1bWUgdGhhdCB0aGUgY29ycmVjdCBwYWNrYWdlIGV4aXN0c1xuICAgICAgICAgIC8vIG9uIHRoZSB1cGxpbmtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgKGVycjogRXJyb3IsIHVwTGlua3NFcnJvcnM6IGFueSk6IEFzeW5jUmVzdWx0QXJyYXlDYWxsYmFjazx1bmtub3duLCBFcnJvcj4gPT4ge1xuICAgICAgICBhc3NlcnQoIWVyciAmJiBBcnJheS5pc0FycmF5KHVwTGlua3NFcnJvcnMpKTtcblxuICAgICAgICAvLyBDaGVjayBmb3IgY29ubmVjdGlvbiB0aW1lb3V0IG9yIHJlc2V0IGVycm9ycyB3aXRoIHVwbGluayhzKVxuICAgICAgICAvLyAodGhlc2Ugc2hvdWxkIGJlIGhhbmRsZWQgZGlmZmVyZW50bHkgZnJvbSB0aGUgcGFja2FnZSBub3QgYmVpbmcgZm91bmQpXG4gICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICBsZXQgdXBsaW5rVGltZW91dEVycm9yO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXBMaW5rc0Vycm9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHVwTGlua3NFcnJvcnNbaV0pIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB1cExpbmtzRXJyb3JzW2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVwTGlua3NFcnJvcnNbaV1bal0pIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGNvZGUgPSB1cExpbmtzRXJyb3JzW2ldW2pdLmNvZGU7XG4gICAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gJ0VUSU1FRE9VVCcgfHwgY29kZSA9PT0gJ0VTT0NLRVRUSU1FRE9VVCcgfHwgY29kZSA9PT0gJ0VDT05OUkVTRVQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwbGlua1RpbWVvdXRFcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh1cGxpbmtUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhFcnJvckNvZGUuZ2V0U2VydmljZVVuYXZhaWxhYmxlKCksIG51bGwsIHVwTGlua3NFcnJvcnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soRXJyb3JDb2RlLmdldE5vdEZvdW5kKEFQSV9FUlJPUi5OT19QQUNLQUdFKSwgbnVsbCwgdXBMaW5rc0Vycm9ycyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodXBMaW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcGFja2FnZUluZm8pO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5sb2NhbFN0b3JhZ2UudXBkYXRlVmVyc2lvbnMoXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBwYWNrYWdlSW5mbyxcbiAgICAgICAgICBhc3luYyAoZXJyLCBwYWNrYWdlSnNvbkxvY2FsOiBQYWNrYWdlKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBBbnkgZXJyb3IgaGVyZSB3aWxsIGNhdXNlIGEgNDA0LCBsaWtlIGFuIHVwbGluayBlcnJvci4gVGhpcyBpcyBsaWtlbHkgdGhlIHJpZ2h0IHRoaW5nIHRvIGRvXG4gICAgICAgICAgICAvLyBhcyBhIGJyb2tlbiBmaWx0ZXIgaXMgYSBzZWN1cml0eSByaXNrLlxuICAgICAgICAgICAgY29uc3QgZmlsdGVyRXJyb3JzOiBFcnJvcltdID0gW107XG4gICAgICAgICAgICAvLyBUaGlzIE1VU1QgYmUgZG9uZSBzZXJpYWxseSBhbmQgbm90IGluIHBhcmFsbGVsIGFzIHRoZXkgbW9kaWZ5IHBhY2thZ2VKc29uTG9jYWxcbiAgICAgICAgICAgIGZvciAoY29uc3QgZmlsdGVyIG9mIHNlbGYuZmlsdGVycyA/PyBbXSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIFRoZXNlIGZpbHRlcnMgY2FuIGFzc3VtZSBpdCdzIHNhdmUgdG8gbW9kaWZ5IHBhY2thZ2VKc29uTG9jYWwgYW5kIHJldHVybiBpdCBkaXJlY3RseSBmb3JcbiAgICAgICAgICAgICAgICAvLyBwZXJmb3JtYW5jZSAoaS5lLiBuZWVkIG5vdCBiZSBwdXJlKVxuICAgICAgICAgICAgICAgIHBhY2thZ2VKc29uTG9jYWwgPSBhd2FpdCBmaWx0ZXIuZmlsdGVyX21ldGFkYXRhKHBhY2thZ2VKc29uTG9jYWwpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIGZpbHRlckVycm9ycy5wdXNoKGVycik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHBhY2thZ2VKc29uTG9jYWwsIF8uY29uY2F0KHVwTGlua3NFcnJvcnMsIGZpbHRlckVycm9ycykpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIGhpZGRlbiB2YWx1ZSBmb3IgZWFjaCB2ZXJzaW9uLlxuICAgKiBAcGFyYW0ge0FycmF5fSB2ZXJzaW9ucyBsaXN0IG9mIHZlcnNpb25cbiAgICogQHBhcmFtIHtTdHJpbmd9IHVwTGluayB1cGxpbmsgbmFtZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHVibGljIF91cGRhdGVWZXJzaW9uc0hpZGRlblVwTGluayh2ZXJzaW9uczogVmVyc2lvbnMsIHVwTGluazogUHJveHlTdG9yYWdlKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBpIGluIHZlcnNpb25zKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHZlcnNpb25zLCBpKSkge1xuICAgICAgICBjb25zdCB2ZXJzaW9uID0gdmVyc2lvbnNbaV07XG5cbiAgICAgICAgLy8gaG9sZHMgYSBcImhpZGRlblwiIHZhbHVlIHRvIGJlIHVzZWQgYnkgdGhlIHBhY2thZ2Ugc3RvcmFnZS5cbiAgICAgICAgdmVyc2lvbltTeW1ib2wuZm9yKCdfX3ZlcmRhY2Npb191cGxpbmsnKV0gPSB1cExpbmsudXBuYW1lO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTdG9yYWdlO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxNQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxNQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxPQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxPQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFFQSxJQUFBSyxPQUFBLEdBQUFMLE9BQUE7QUFDQSxJQUFBTSxLQUFBLEdBQUFOLE9BQUE7QUFDQSxJQUFBTyxRQUFBLEdBQUFQLE9BQUE7QUFDQSxJQUFBUSxtQkFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsY0FBQSxHQUFBVCxPQUFBO0FBQ0EsSUFBQVUsUUFBQSxHQUFBVixPQUFBO0FBZUEsSUFBQVcsT0FBQSxHQUFBWCxPQUFBO0FBRUEsSUFBQVksVUFBQSxHQUFBWixPQUFBO0FBQ0EsSUFBQWEsYUFBQSxHQUFBZCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWMsY0FBQSxHQUFBZCxPQUFBO0FBQ0EsSUFBQWUsYUFBQSxHQUFBZixPQUFBO0FBU0EsSUFBQWdCLFVBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsV0FBQSxHQUFBakIsT0FBQTtBQUNBLElBQUFrQixNQUFBLEdBQUFsQixPQUFBO0FBQWlFLFNBQUFELHVCQUFBb0IsQ0FBQSxXQUFBQSxDQUFBLElBQUFBLENBQUEsQ0FBQUMsVUFBQSxHQUFBRCxDQUFBLEtBQUFFLE9BQUEsRUFBQUYsQ0FBQTtBQUVqRSxNQUFNRyxLQUFLLEdBQUcsSUFBQUMsY0FBVSxFQUFDLG1CQUFtQixDQUFDO0FBRTdDLE1BQU1DLE9BQU8sQ0FBQztFQU9MQyxXQUFXQSxDQUFDQyxNQUFjLEVBQUU7SUFDakMsSUFBSSxDQUFDQSxNQUFNLEdBQUdBLE1BQU07SUFDcEIsSUFBSSxDQUFDQyxPQUFPLEdBQUcsSUFBQUMsd0JBQVksRUFBQ0YsTUFBTSxDQUFDO0lBQ25DLElBQUksQ0FBQ0csTUFBTSxHQUFHQSxjQUFNO0lBQ3BCO0lBQ0E7SUFDQSxJQUFJLENBQUNDLFlBQVksR0FBRyxJQUFJO0VBQzFCO0VBRUEsTUFBYUMsSUFBSUEsQ0FBQ0wsTUFBYyxFQUFFTSxPQUF3QixFQUFpQjtJQUN6RSxJQUFJLElBQUksQ0FBQ0YsWUFBWSxLQUFLLElBQUksRUFBRTtNQUM5QixJQUFJLENBQUNFLE9BQU8sR0FBR0EsT0FBTztNQUN0QixNQUFNQyxlQUFlLEdBQUcsTUFBTSxJQUFJLENBQUNDLFdBQVcsQ0FBQ1IsTUFBTSxFQUFFLElBQUksQ0FBQ0csTUFBTSxDQUFDO01BQ25FLElBQUksQ0FBQ0MsWUFBWSxHQUFHLElBQUlLLHFCQUFZLENBQUMsSUFBSSxDQUFDVCxNQUFNLEVBQUVHLGNBQU0sRUFBRUksZUFBZSxDQUFDO01BQzFFLE1BQU0sSUFBSSxDQUFDSCxZQUFZLENBQUNNLFNBQVMsQ0FBQ1YsTUFBTSxDQUFDO01BQ3pDSixLQUFLLENBQUMsMEJBQTBCLENBQUM7SUFDbkMsQ0FBQyxNQUFNO01BQ0xBLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQztJQUMvQztJQUVBLElBQUksQ0FBQyxJQUFJLENBQUNVLE9BQU8sRUFBRTtNQUNqQixJQUFJLENBQUNBLE9BQU8sR0FBRyxNQUFNLElBQUFLLHdCQUFlLEVBQ2xDLElBQUksQ0FBQ1gsTUFBTSxDQUFDTSxPQUFPLEVBQ25CO1FBQ0VOLE1BQU0sRUFBRSxJQUFJLENBQUNBLE1BQU07UUFDbkJHLE1BQU0sRUFBRSxJQUFJLENBQUNBO01BQ2YsQ0FBQyxFQUNBUyxNQUEwQyxJQUFLO1FBQzlDLE9BQU8sT0FBT0EsTUFBTSxDQUFDQyxlQUFlLEtBQUssV0FBVztNQUN0RCxDQUFDLEVBQ0QsSUFBSSxFQUNKLElBQUksQ0FBQ2IsTUFBTSxFQUFFYyxjQUFjLEVBQUVDLFlBQVksRUFDekNDLHFCQUFlLENBQUNDLE1BQ2xCLENBQUM7TUFDRHJCLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUNVLE9BQU8sQ0FBQ1ksTUFBTSxDQUFDO0lBQ3BEO0VBQ0Y7RUFFQSxNQUFjVixXQUFXQSxDQUFDUixNQUFjLEVBQUVHLE1BQWMsRUFBMEI7SUFDaEYsTUFBTUwsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDcUIsZUFBZSxDQUFDLENBQUM7SUFDNUMsSUFBSUMsZUFBQyxDQUFDQyxLQUFLLENBQUN2QixPQUFPLENBQUMsRUFBRTtNQUNwQixJQUFBd0IsZUFBTSxFQUFDLElBQUksQ0FBQ3RCLE1BQU0sQ0FBQ3VCLE9BQU8sRUFBRSxrQ0FBa0MsQ0FBQztNQUMvRDNCLEtBQUssQ0FBQywyRUFBMkUsQ0FBQztNQUNsRixNQUFNUSxZQUFZLEdBQUcsSUFBSW9CLDJCQUFtQixDQUFDeEIsTUFBTSxFQUFFRyxNQUFNLENBQUM7TUFDNURBLE1BQU0sQ0FBQ3NCLElBQUksQ0FDVDtRQUFFQyxJQUFJLEVBQUUsMEJBQTBCO1FBQUVDLGNBQWMsRUFBRVgscUJBQWUsQ0FBQ1k7TUFBUSxDQUFDLEVBQzdFLHdEQUNGLENBQUM7TUFDRCxPQUFPeEIsWUFBWTtJQUNyQjtJQUNBLE9BQU9OLE9BQU87RUFDaEI7RUFFQSxNQUFjcUIsZUFBZUEsQ0FBQSxFQUFxRDtJQUNoRixNQUFNVSxPQUFzQyxHQUFHLE1BQU0sSUFBQWxCLHdCQUFlLEVBR2xFLElBQUksQ0FBQ1gsTUFBTSxDQUFDOEIsS0FBSyxFQUNqQjtNQUNFOUIsTUFBTSxFQUFFLElBQUksQ0FBQ0EsTUFBTTtNQUNuQkcsTUFBTSxFQUFFLElBQUksQ0FBQ0E7SUFDZixDQUFDLEVBQ0FTLE1BQU0sSUFBSztNQUNWLE9BQU8sT0FBT0EsTUFBTSxDQUFDbUIsaUJBQWlCLEtBQUssV0FBVztJQUN4RCxDQUFDLEVBQ0QsSUFBSSxFQUNKLElBQUksQ0FBQy9CLE1BQU0sRUFBRWMsY0FBYyxFQUFFQyxZQUFZLEVBQ3pDQyxxQkFBZSxDQUFDWSxPQUNsQixDQUFDO0lBRUQsSUFBSUMsT0FBTyxDQUFDWCxNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQ3RCLElBQUksQ0FBQ2YsTUFBTSxDQUFDNkIsSUFBSSxDQUNkLHlIQUNGLENBQUM7SUFDSDtJQUVBLE9BQU9aLGVBQUMsQ0FBQ2EsSUFBSSxDQUFDSixPQUFPLENBQUM7RUFDeEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBYUssVUFBVUEsQ0FBQ1IsSUFBWSxFQUFFUyxRQUFhLEVBQUVDLFFBQWEsRUFBaUI7SUFDakYsSUFBSTtNQUNGLE1BQU0sSUFBQUMsK0JBQWlCLEVBQUNYLElBQUksRUFBRSxJQUFJLENBQUN0QixZQUFZLENBQUM7TUFDaEQsTUFBTSxJQUFBa0MsZ0NBQWtCLEVBQ3RCWixJQUFJLEVBQ0osSUFBSSxDQUFDYSxzQkFBc0IsQ0FBQyxDQUFDLEVBQzdCLElBQUksQ0FBQ0Msb0JBQW9CLENBQUNDLElBQUksQ0FBQyxJQUFJLENBQ3JDLENBQUM7TUFDRCxNQUFNLElBQUFDLDRCQUFjLEVBQUNoQixJQUFJLEVBQUVTLFFBQVEsRUFBRSxJQUFJLENBQUMvQixZQUFZLENBQUM7TUFDdkRnQyxRQUFRLENBQUMsQ0FBQztJQUNaLENBQUMsQ0FBQyxPQUFPTyxHQUFRLEVBQUU7TUFDakJQLFFBQVEsQ0FBQ08sR0FBRyxDQUFDO0lBQ2Y7RUFDRjtFQUVRSixzQkFBc0JBLENBQUEsRUFBWTtJQUN4QyxPQUNFLE9BQU8sSUFBSSxDQUFDdkMsTUFBTSxDQUFDNEMsT0FBTyxLQUFLLFdBQVcsSUFDMUN4QixlQUFDLENBQUN5QixTQUFTLENBQUMsSUFBSSxDQUFDN0MsTUFBTSxDQUFDNEMsT0FBTyxDQUFDRSxhQUFhLENBQUMsSUFDOUMsSUFBSSxDQUFDOUMsTUFBTSxDQUFDNEMsT0FBTyxDQUFDRSxhQUFhO0VBRXJDO0VBRU9DLFVBQVVBLENBQUNDLE1BQW1CLEVBQW9CO0lBQ3ZELE9BQU8sSUFBSSxDQUFDNUMsWUFBWSxDQUFDMkMsVUFBVSxDQUFDQyxNQUFNLENBQUM7RUFDN0M7RUFFT0MsU0FBU0EsQ0FBQ0MsS0FBWSxFQUFpQjtJQUM1QyxPQUFPLElBQUksQ0FBQzlDLFlBQVksQ0FBQzZDLFNBQVMsQ0FBQ0MsS0FBSyxDQUFDO0VBQzNDO0VBRU9DLFdBQVdBLENBQUNDLElBQVksRUFBRUMsUUFBZ0IsRUFBZ0I7SUFDL0QsT0FBTyxJQUFJLENBQUNqRCxZQUFZLENBQUMrQyxXQUFXLENBQUNDLElBQUksRUFBRUMsUUFBUSxDQUFDO0VBQ3REOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NDLFVBQVVBLENBQ2Y1QixJQUFZLEVBQ1o2QixPQUFlLEVBQ2ZwQixRQUFpQixFQUNqQnFCLEdBQWdCLEVBQ2hCcEIsUUFBa0IsRUFDWjtJQUNOLElBQUksQ0FBQ2hDLFlBQVksQ0FBQ2tELFVBQVUsQ0FBQzVCLElBQUksRUFBRTZCLE9BQU8sRUFBRXBCLFFBQVEsRUFBRXFCLEdBQUcsRUFBRXBCLFFBQVEsQ0FBQztFQUN0RTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtFQUNTcUIsU0FBU0EsQ0FBQy9CLElBQVksRUFBRWdDLE9BQWtCLEVBQUV0QixRQUFrQixFQUFRO0lBQzNFLElBQUksQ0FBQ2hDLFlBQVksQ0FBQ3FELFNBQVMsQ0FBQy9CLElBQUksRUFBRWdDLE9BQU8sRUFBRXRCLFFBQVEsQ0FBQztFQUN0RDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ1N1QixhQUFhQSxDQUNsQmpDLElBQVksRUFDWlMsUUFBaUIsRUFDakJ5QixRQUFnQixFQUNoQnhCLFFBQWtCLEVBQ1o7SUFDTixJQUFJLENBQUNoQyxZQUFZLENBQUN1RCxhQUFhLENBQUNqQyxJQUFJLEVBQUVTLFFBQVEsRUFBRXlCLFFBQVEsRUFBRXhCLFFBQVEsQ0FBQztFQUNyRTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ1N5QixhQUFhQSxDQUFDbkMsSUFBWSxFQUFFVSxRQUFrQixFQUFRO0lBQzNELElBQUksQ0FBQ2hDLFlBQVksQ0FBQ3lELGFBQWEsQ0FBQ25DLElBQUksRUFBRVUsUUFBUSxDQUFDO0lBQy9DO0lBQ0EwQixrQ0FBbUIsQ0FBQ0MsTUFBTSxDQUFDckMsSUFBSSxDQUFDLENBQUNzQyxLQUFLLENBQUVDLE1BQU0sSUFBSztNQUNqRHJFLEtBQUssQ0FBQyxzQ0FBc0MsRUFBRXFFLE1BQU0sQ0FBQztNQUNyRDlELGNBQU0sQ0FBQytELEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQztJQUNuRCxDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTQyxhQUFhQSxDQUFDekMsSUFBWSxFQUFFMEMsUUFBZ0IsRUFBRVIsUUFBZ0IsRUFBRXhCLFFBQWtCLEVBQVE7SUFDL0YsSUFBSSxDQUFDaEMsWUFBWSxDQUFDK0QsYUFBYSxDQUFDekMsSUFBSSxFQUFFMEMsUUFBUSxFQUFFUixRQUFRLEVBQUV4QixRQUFRLENBQUM7RUFDckU7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNTaUMsVUFBVUEsQ0FBQzNDLElBQVksRUFBRTBDLFFBQWdCLEVBQUU7SUFDaEQsT0FBTyxJQUFJLENBQUNoRSxZQUFZLENBQUNpRSxVQUFVLENBQUMzQyxJQUFJLEVBQUUwQyxRQUFRLENBQUM7RUFDckQ7RUFFT0UsZUFBZUEsQ0FBQzVDLElBQVksRUFBRTBDLFFBQWdCLEVBQW9CO0lBQ3ZFLE1BQU1HLElBQUksR0FBRyxJQUFJO0lBQ2pCLE9BQU8sSUFBSUMsT0FBTyxDQUFVLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFXO01BQ3JELElBQUlDLFdBQWdCLEdBQUdKLElBQUksQ0FBQ25FLFlBQVksQ0FBQ3dFLFVBQVUsQ0FBQ2xELElBQUksRUFBRTBDLFFBQVEsQ0FBQztNQUNuRSxJQUFJUyxNQUFNLEdBQUcsS0FBSztNQUNsQkYsV0FBVyxDQUFDRyxFQUFFLENBQUMsT0FBTyxFQUFHbkMsR0FBRyxJQUFVO1FBQ3BDLElBQUlrQyxNQUFNLElBQUlsQyxHQUFHLENBQUNvQyxNQUFNLEtBQUtDLHNCQUFXLENBQUNDLFNBQVMsRUFBRTtVQUNsRFAsTUFBTSxDQUFDL0IsR0FBRyxDQUFDO1FBQ2I7UUFDQTtRQUNBLElBQUlnQyxXQUFXLEVBQUU7VUFDZkEsV0FBVyxDQUFDTyxLQUFLLENBQUMsQ0FBQztVQUNuQlAsV0FBVyxHQUFHLElBQUk7UUFDcEI7UUFDQUYsT0FBTyxDQUFDLEtBQUssQ0FBQztNQUNoQixDQUFDLENBQUM7TUFDRkUsV0FBVyxDQUFDRyxFQUFFLENBQUMsTUFBTSxFQUFFLFlBQWtCO1FBQ3ZDRCxNQUFNLEdBQUcsSUFBSTtRQUNiRixXQUFXLENBQUNPLEtBQUssQ0FBQyxDQUFDO1FBQ25CUCxXQUFXLEdBQUcsSUFBSTtRQUNsQkYsT0FBTyxDQUFDLElBQUksQ0FBQztNQUNmLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NHLFVBQVVBLENBQUNsRCxJQUFZLEVBQUUwQyxRQUFnQixFQUFFO0lBQ2hELE1BQU1lLFVBQVUsR0FBRyxJQUFJQyxvQkFBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RDRCxVQUFVLENBQUNELEtBQUssR0FBRyxZQUFZLENBQUMsQ0FBQztJQUVqQyxNQUFNWCxJQUFJLEdBQUcsSUFBSTs7SUFFakI7SUFDQTs7SUFFQTtJQUNBO0lBQ0EsSUFBSUksV0FBZ0IsR0FBR0osSUFBSSxDQUFDbkUsWUFBWSxDQUFDd0UsVUFBVSxDQUFDbEQsSUFBSSxFQUFFMEMsUUFBUSxDQUFDO0lBQ25FLElBQUlTLE1BQU0sR0FBRyxLQUFLO0lBQ2xCRixXQUFXLENBQUNHLEVBQUUsQ0FBQyxPQUFPLEVBQUduQyxHQUFHLElBQVU7TUFDcEMsSUFBSWtDLE1BQU0sSUFBSWxDLEdBQUcsQ0FBQ29DLE1BQU0sS0FBS0Msc0JBQVcsQ0FBQ0MsU0FBUyxFQUFFO1FBQ2xELE9BQU9FLFVBQVUsQ0FBQ0UsSUFBSSxDQUFDLE9BQU8sRUFBRTFDLEdBQUcsQ0FBQztNQUN0Qzs7TUFFQTtNQUNBLE1BQU0yQyxNQUFNLEdBQUczQyxHQUFHO01BQ2xCZ0MsV0FBVyxDQUFDTyxLQUFLLENBQUMsQ0FBQztNQUNuQlAsV0FBVyxHQUFHLElBQUksQ0FBQyxDQUFDO01BQ3BCSixJQUFJLENBQUNuRSxZQUFZLENBQUNtRixrQkFBa0IsQ0FBQzdELElBQUksRUFBRSxDQUFDaUIsR0FBRyxFQUFFbEIsSUFBYSxLQUFXO1FBQ3ZFLElBQUlMLGVBQUMsQ0FBQ0MsS0FBSyxDQUFDc0IsR0FBRyxDQUFDLElBQUlsQixJQUFJLENBQUMrRCxVQUFVLElBQUlwRSxlQUFDLENBQUNDLEtBQUssQ0FBQ0ksSUFBSSxDQUFDK0QsVUFBVSxDQUFDcEIsUUFBUSxDQUFDLENBQUMsS0FBSyxLQUFLLEVBQUU7VUFDbkY7VUFDQXFCLFNBQVMsQ0FBQ2hFLElBQUksQ0FBQytELFVBQVUsQ0FBQ3BCLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsTUFBTTtVQUNMO1VBQ0FHLElBQUksQ0FBQy9CLG9CQUFvQixDQUFDZCxJQUFJLEVBQUVELElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDa0IsR0FBRyxFQUFFbEIsSUFBYSxLQUFVO1lBQ3JFLElBQUlMLGVBQUMsQ0FBQ0MsS0FBSyxDQUFDc0IsR0FBRyxDQUFDLEtBQUssS0FBSyxFQUFFO2NBQzFCLE9BQU93QyxVQUFVLENBQUNFLElBQUksQ0FBQyxPQUFPLEVBQUUxQyxHQUFHLENBQUM7WUFDdEM7WUFDQSxJQUFJdkIsZUFBQyxDQUFDQyxLQUFLLENBQUNJLElBQUksQ0FBQytELFVBQVUsQ0FBQyxJQUFJcEUsZUFBQyxDQUFDQyxLQUFLLENBQUNJLElBQUksQ0FBQytELFVBQVUsQ0FBQ3BCLFFBQVEsQ0FBQyxDQUFDLEVBQUU7Y0FDbEUsT0FBT2UsVUFBVSxDQUFDRSxJQUFJLENBQUMsT0FBTyxFQUFFQyxNQUFNLENBQUM7WUFDekM7WUFDQUcsU0FBUyxDQUFDaEUsSUFBSSxDQUFDK0QsVUFBVSxDQUFDcEIsUUFBUSxDQUFDLENBQUM7VUFDdEMsQ0FBQyxDQUFDO1FBQ0o7TUFDRixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7SUFDRk8sV0FBVyxDQUFDRyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsVUFBVVksQ0FBQyxFQUFRO01BQ2xEUCxVQUFVLENBQUNFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRUssQ0FBQyxDQUFDO0lBQ3RDLENBQUMsQ0FBQztJQUNGZixXQUFXLENBQUNHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsWUFBa0I7TUFDdkNELE1BQU0sR0FBRyxJQUFJO01BQ2JGLFdBQVcsQ0FBQ2dCLElBQUksQ0FBQ1IsVUFBVSxDQUFDO0lBQzlCLENBQUMsQ0FBQztJQUNGLE9BQU9BLFVBQVU7O0lBRWpCO0FBQ0o7QUFDQTtBQUNBO0lBQ0ksU0FBU00sU0FBU0EsQ0FBQ0csSUFBYyxFQUFRO01BQ3ZDLElBQUlDLE1BQVcsR0FBRyxJQUFJO01BRXRCLEtBQUssTUFBTUMsUUFBUSxJQUFJdkIsSUFBSSxDQUFDdEUsT0FBTyxFQUFFO1FBQ25DLElBQUksSUFBQThGLGtCQUFVLEVBQUNyRSxJQUFJLEVBQUVvRSxRQUFRLEVBQUV2QixJQUFJLENBQUN2RSxNQUFNLENBQUNnRyxRQUFRLENBQUMsRUFBRTtVQUNwREgsTUFBTSxHQUFHdEIsSUFBSSxDQUFDdEUsT0FBTyxDQUFDNkYsUUFBUSxDQUFDO1FBQ2pDO01BQ0Y7TUFFQSxJQUFJRCxNQUFNLElBQUksSUFBSSxFQUFFO1FBQ2xCQSxNQUFNLEdBQUcsSUFBSUksa0JBQVksQ0FDdkI7VUFDRUMsR0FBRyxFQUFFTixJQUFJLENBQUNNLEdBQUc7VUFDYkMsS0FBSyxFQUFFLElBQUk7VUFDWEMsY0FBYyxFQUFFO1FBQ2xCLENBQUMsRUFDRDdCLElBQUksQ0FBQ3ZFLE1BQ1AsQ0FBQztNQUNIO01BRUEsSUFBSXFHLFVBQWUsR0FBRyxJQUFJO01BQzFCLElBQUlSLE1BQU0sQ0FBQzdGLE1BQU0sQ0FBQ21HLEtBQUssRUFBRTtRQUN2QkUsVUFBVSxHQUFHOUIsSUFBSSxDQUFDbkUsWUFBWSxDQUFDaUUsVUFBVSxDQUFDM0MsSUFBSSxFQUFFMEMsUUFBUSxDQUFDO01BQzNEO01BRUEsSUFBSWtDLE9BQU8sR0FBRyxTQUFBQSxDQUFBLEVBQWtCO1FBQzlCO1FBQ0FBLE9BQU8sR0FBRyxTQUFBQSxDQUFBLEVBQVksQ0FBQyxDQUFDO1FBQ3hCLE1BQU1DLFFBQVEsR0FBR1YsTUFBTSxDQUFDVyxZQUFZLENBQUNaLElBQUksQ0FBQ00sR0FBRyxDQUFDO1FBQzlDSyxRQUFRLENBQUN6QixFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVVuQyxHQUFHLEVBQVE7VUFDeEMsSUFBSTBELFVBQVUsRUFBRTtZQUNkQSxVQUFVLENBQUNuQixLQUFLLENBQUMsQ0FBQztVQUNwQjtVQUNBbUIsVUFBVSxHQUFHLElBQUk7VUFDakJsQixVQUFVLENBQUNFLElBQUksQ0FBQyxPQUFPLEVBQUUxQyxHQUFHLENBQUM7UUFDL0IsQ0FBQyxDQUFDO1FBQ0Y0RCxRQUFRLENBQUN6QixFQUFFLENBQUMsS0FBSyxFQUFFLFlBQWtCO1VBQ25DLElBQUl1QixVQUFVLEVBQUU7WUFDZEEsVUFBVSxDQUFDSSxJQUFJLENBQUMsQ0FBQztVQUNuQjtRQUNGLENBQUMsQ0FBQztRQUVGRixRQUFRLENBQUN6QixFQUFFLENBQUMsZ0JBQWdCLEVBQUUsVUFBVVksQ0FBQyxFQUFRO1VBQy9DUCxVQUFVLENBQUNFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRUssQ0FBQyxDQUFDO1VBQ3BDLElBQUlXLFVBQVUsRUFBRTtZQUNkQSxVQUFVLENBQUNoQixJQUFJLENBQUMsZ0JBQWdCLEVBQUVLLENBQUMsQ0FBQztVQUN0QztRQUNGLENBQUMsQ0FBQztRQUNGYSxRQUFRLENBQUNaLElBQUksQ0FBQ1IsVUFBVSxDQUFDO1FBQ3pCLElBQUlrQixVQUFVLEVBQUU7VUFDZEUsUUFBUSxDQUFDWixJQUFJLENBQUNVLFVBQVUsQ0FBQztRQUMzQjtNQUNGLENBQUM7TUFFRCxJQUFJQSxVQUFVLEVBQUU7UUFDZEEsVUFBVSxDQUFDdkIsRUFBRSxDQUFDLE1BQU0sRUFBRSxZQUFrQjtVQUN0Q3dCLE9BQU8sQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxDQUFDO1FBRUZELFVBQVUsQ0FBQ3ZCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBVW5DLEdBQUcsRUFBUTtVQUMxQzRCLElBQUksQ0FBQ3BFLE1BQU0sQ0FBQzZCLElBQUksQ0FDZDtZQUFFVyxHQUFHLEVBQUVBLEdBQUc7WUFBRStELFFBQVEsRUFBRWQ7VUFBSyxDQUFDLEVBQzVCLDZEQUNGLENBQUM7VUFDRCxJQUFJUyxVQUFVLEVBQUU7WUFDZEEsVUFBVSxDQUFDbkIsS0FBSyxDQUFDLENBQUM7VUFDcEI7VUFDQW1CLFVBQVUsR0FBRyxJQUFJO1VBQ2pCQyxPQUFPLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQztNQUNKLENBQUMsTUFBTTtRQUNMQSxPQUFPLENBQUMsQ0FBQztNQUNYO0lBQ0Y7RUFDRjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFFU0ssVUFBVUEsQ0FBQ0MsT0FBTyxFQUFRO0lBQy9CLElBQUksQ0FBQ3hHLFlBQVksQ0FBQ21GLGtCQUFrQixDQUFDcUIsT0FBTyxDQUFDbEYsSUFBSSxFQUFFLENBQUNpQixHQUFHLEVBQUVrRSxJQUFJLEtBQVc7TUFDdEUsSUFBSWxFLEdBQUcsS0FBSyxDQUFDQSxHQUFHLENBQUNvQyxNQUFNLElBQUlwQyxHQUFHLENBQUNvQyxNQUFNLElBQUlDLHNCQUFXLENBQUM4QixjQUFjLENBQUMsRUFBRTtRQUNwRTtRQUNBLE9BQU9GLE9BQU8sQ0FBQ3hFLFFBQVEsQ0FBQ08sR0FBRyxDQUFDO01BQzlCO01BRUEsSUFBSSxDQUFDSCxvQkFBb0IsQ0FDdkJvRSxPQUFPLENBQUNsRixJQUFJLEVBQ1ptRixJQUFJLEVBQ0o7UUFBRUUsR0FBRyxFQUFFSCxPQUFPLENBQUNHLEdBQUc7UUFBRUMsV0FBVyxFQUFFSixPQUFPLENBQUNJO01BQVksQ0FBQyxFQUN0RCxTQUFTQyw0QkFBNEJBLENBQUN0RSxHQUFHLEVBQUV1RSxNQUFlLEVBQUVDLFlBQVksRUFBUTtRQUM5RSxJQUFJeEUsR0FBRyxFQUFFO1VBQ1AsT0FBT2lFLE9BQU8sQ0FBQ3hFLFFBQVEsQ0FBQ08sR0FBRyxDQUFDO1FBQzlCO1FBRUEsSUFBQXlFLHdCQUFpQixFQUFDLElBQUFDLDZCQUFlLEVBQUNULE9BQU8sQ0FBQ1UsY0FBYyxFQUFFSixNQUFNLENBQUMsQ0FBQzs7UUFFbEU7UUFDQUEsTUFBTSxDQUFDSyxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLElBQUlYLE9BQU8sQ0FBQ1ksV0FBVyxLQUFLLElBQUksRUFBRTtVQUNoQ1osT0FBTyxDQUFDeEUsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFBcUYsd0NBQTBCLEVBQUNQLE1BQU0sQ0FBQyxFQUFFQyxZQUFZLENBQUM7UUFDMUUsQ0FBQyxNQUFNO1VBQ0xQLE9BQU8sQ0FBQ3hFLFFBQVEsQ0FBQyxJQUFJLEVBQUU4RSxNQUFNLEVBQUVDLFlBQVksQ0FBQztRQUM5QztNQUNGLENBQ0YsQ0FBQztJQUNILENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNTTyxNQUFNQSxDQUFDQyxRQUFnQixFQUFFZixPQUFZLEVBQUU7SUFDNUMsTUFBTXJDLElBQUksR0FBRyxJQUFJO0lBQ2pCLE1BQU1xRCxZQUFpQixHQUFHLElBQUlDLGVBQU0sQ0FBQ0MsV0FBVyxDQUFDO01BQUVDLFVBQVUsRUFBRTtJQUFLLENBQUMsQ0FBQztJQUN0RUMsY0FBSyxDQUFDQyxVQUFVLENBQ2RDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLElBQUksQ0FBQ2xJLE9BQU8sQ0FBQyxFQUN6QixVQUFVbUksT0FBTyxFQUFFQyxFQUFFLEVBQVE7TUFDM0I7TUFDQSxJQUFJekIsT0FBTyxDQUFDRyxHQUFHLEVBQUV1QixLQUFLLEVBQUVDLEtBQUssS0FBS0MsU0FBUyxFQUFFO1FBQzNDLE9BQU9ILEVBQUUsQ0FBQyxDQUFDO01BQ2I7TUFDQWxJLGNBQU0sQ0FBQ3NCLElBQUksQ0FBQyxxQkFBcUIyRyxPQUFPLEVBQUUsQ0FBQztNQUMzQztNQUNBLE1BQU1LLFlBQVksR0FBR2xFLElBQUksQ0FBQ3RFLE9BQU8sQ0FBQ21JLE9BQU8sQ0FBQyxDQUFDVixNQUFNLENBQUNkLE9BQU8sQ0FBQztNQUMxRDtNQUNBNkIsWUFBWSxDQUFDOUMsSUFBSSxDQUFDaUMsWUFBWSxFQUFFO1FBQUVjLEdBQUcsRUFBRTtNQUFNLENBQUMsQ0FBQztNQUMvQ0QsWUFBWSxDQUFDM0QsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVbkMsR0FBRyxFQUFRO1FBQzVDNEIsSUFBSSxDQUFDcEUsTUFBTSxDQUFDK0QsS0FBSyxDQUFDO1VBQUV2QixHQUFHLEVBQUVBO1FBQUksQ0FBQyxFQUFFLDhCQUE4QixDQUFDO1FBQy9EMEYsRUFBRSxDQUFDLENBQUM7UUFDSjtRQUNBQSxFQUFFLEdBQUcsU0FBQUEsQ0FBQSxFQUFrQixDQUFDLENBQUM7TUFDM0IsQ0FBQyxDQUFDO01BQ0ZJLFlBQVksQ0FBQzNELEVBQUUsQ0FBQyxLQUFLLEVBQUUsWUFBa0I7UUFDdkN1RCxFQUFFLENBQUMsQ0FBQztRQUNKO1FBQ0FBLEVBQUUsR0FBRyxTQUFBQSxDQUFBLEVBQWtCLENBQUMsQ0FBQztNQUMzQixDQUFDLENBQUM7TUFFRlQsWUFBWSxDQUFDMUMsS0FBSyxHQUFHLFlBQWtCO1FBQ3JDLElBQUl1RCxZQUFZLENBQUN2RCxLQUFLLEVBQUU7VUFDdEJ1RCxZQUFZLENBQUN2RCxLQUFLLENBQUMsQ0FBQztRQUN0QjtRQUNBbUQsRUFBRSxDQUFDLENBQUM7UUFDSjtRQUNBQSxFQUFFLEdBQUcsU0FBQUEsQ0FBQSxFQUFrQixDQUFDLENBQUM7TUFDM0IsQ0FBQztJQUNILENBQUM7SUFDRDtJQUNBLFlBQWtCO01BQ2hCO01BQ0EsTUFBTU0saUJBQWlCLEdBQUdwRSxJQUFJLENBQUNuRSxZQUFZLENBQUNzSCxNQUFNLENBQUNDLFFBQVEsRUFBRWYsT0FBTyxDQUFDO01BQ3JFZ0IsWUFBWSxDQUFDMUMsS0FBSyxHQUFHLFlBQWtCO1FBQ3JDeUQsaUJBQWlCLENBQUN6RCxLQUFLLENBQUMsQ0FBQztNQUMzQixDQUFDO01BQ0R5RCxpQkFBaUIsQ0FBQ2hELElBQUksQ0FBQ2lDLFlBQVksRUFBRTtRQUFFYyxHQUFHLEVBQUU7TUFBSyxDQUFDLENBQUM7TUFDbkRDLGlCQUFpQixDQUFDN0QsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFVbkMsR0FBUSxFQUFRO1FBQ3RENEIsSUFBSSxDQUFDcEUsTUFBTSxDQUFDK0QsS0FBSyxDQUFDO1VBQUV2QixHQUFHLEVBQUVBO1FBQUksQ0FBQyxFQUFFLDhCQUE4QixDQUFDO1FBQy9EaUYsWUFBWSxDQUFDYyxHQUFHLENBQUMsQ0FBQztNQUNwQixDQUFDLENBQUM7SUFDSixDQUNGLENBQUM7SUFFRCxPQUFPZCxZQUFZO0VBQ3JCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0VBQ1NnQixnQkFBZ0JBLENBQUN4RyxRQUFrQixFQUFRO0lBQ2hELE1BQU1tQyxJQUFJLEdBQUcsSUFBSTtJQUNqQixJQUFJLENBQUNuRSxZQUFZLENBQUN5SSxhQUFhLENBQUNDLEdBQUcsQ0FBQyxDQUFDbkcsR0FBRyxFQUFFb0csTUFBTSxLQUFXO01BQ3pELElBQUlwRyxHQUFHLEVBQUU7UUFDUFAsUUFBUSxDQUFDTyxHQUFHLENBQUM7TUFDZjtNQUVBLE1BQU1xRCxRQUFtQixHQUFHLEVBQUU7TUFDOUIsTUFBTVcsVUFBVSxHQUFHLFNBQUFBLENBQVVxQyxPQUFPLEVBQVE7UUFDMUN6RSxJQUFJLENBQUNuRSxZQUFZLENBQUNtRixrQkFBa0IsQ0FDbEN3RCxNQUFNLENBQUNDLE9BQU8sQ0FBQyxFQUNmLFVBQVVyRyxHQUFHLEVBQUVzRyxXQUFvQixFQUFRO1VBQ3pDLElBQUk3SCxlQUFDLENBQUNDLEtBQUssQ0FBQ3NCLEdBQUcsQ0FBQyxFQUFFO1lBQ2hCLE1BQU11RyxNQUFNLEdBQUdELFdBQVcsQ0FBQ0Usb0JBQVMsQ0FBQyxDQUFDRCxNQUFNO1lBQzVDLElBQUlBLE1BQU0sSUFBSUQsV0FBVyxDQUFDRyxRQUFRLENBQUNGLE1BQU0sQ0FBQyxFQUFFO2NBQzFDLE1BQU0zRixPQUFnQixHQUFHMEYsV0FBVyxDQUFDRyxRQUFRLENBQUNGLE1BQU0sQ0FBQztjQUNyRCxNQUFNRyxRQUFRLEdBQUdKLFdBQVcsQ0FBQ0ssSUFBbUI7Y0FDaEQsTUFBTUEsSUFBSSxHQUFHRCxRQUFRLENBQUNILE1BQU0sQ0FBQztjQUM3QjtjQUNBM0YsT0FBTyxDQUFDK0YsSUFBSSxHQUFHQSxJQUFJOztjQUVuQjtjQUNBO2NBQ0EvRixPQUFPLENBQUNnRyxLQUFLLEdBQUdOLFdBQVcsQ0FBQ00sS0FBSztjQUVqQ3ZELFFBQVEsQ0FBQ3dELElBQUksQ0FBQ2pHLE9BQU8sQ0FBQztZQUN4QixDQUFDLE1BQU07Y0FDTGdCLElBQUksQ0FBQ3BFLE1BQU0sQ0FBQzZCLElBQUksQ0FDZDtnQkFBRXlILE9BQU8sRUFBRVYsTUFBTSxDQUFDQyxPQUFPO2NBQUUsQ0FBQyxFQUM1QixrREFDRixDQUFDO1lBQ0g7VUFDRjtVQUVBLElBQUlBLE9BQU8sSUFBSUQsTUFBTSxDQUFDN0gsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNoQ2tCLFFBQVEsQ0FBQyxJQUFJLEVBQUU0RCxRQUFRLENBQUM7VUFDMUIsQ0FBQyxNQUFNO1lBQ0xXLFVBQVUsQ0FBQ3FDLE9BQU8sR0FBRyxDQUFDLENBQUM7VUFDekI7UUFDRixDQUNGLENBQUM7TUFDSCxDQUFDO01BRUQsSUFBSUQsTUFBTSxDQUFDN0gsTUFBTSxFQUFFO1FBQ2pCeUYsVUFBVSxDQUFDLENBQUMsQ0FBQztNQUNmLENBQUMsTUFBTTtRQUNMdkUsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7TUFDcEI7SUFDRixDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ1NJLG9CQUFvQkEsQ0FDekJkLElBQVksRUFDWmdJLFdBQXFCLEVBQ3JCOUMsT0FBcUIsRUFDckJ4RSxRQUFrQixFQUNaO0lBQ04sSUFBSXVILEtBQUssR0FBRyxJQUFJO0lBQ2hCLE1BQU1wRixJQUFJLEdBQUcsSUFBSTtJQUNqQixNQUFNcUYsT0FBdUIsR0FBRyxFQUFFO0lBQ2xDLE1BQU1DLG9CQUFvQixHQUFHekksZUFBQyxDQUFDQyxLQUFLLENBQUN1RixPQUFPLENBQUNJLFdBQVcsQ0FBQyxJQUFJSixPQUFPLENBQUNJLFdBQVc7SUFFaEYsSUFBSSxDQUFDMEMsV0FBVyxFQUFFO01BQ2hCQyxLQUFLLEdBQUcsS0FBSztNQUNiRCxXQUFXLEdBQUcsSUFBQUkscUNBQXVCLEVBQUNwSSxJQUFJLENBQUM7SUFDN0M7SUFFQSxLQUFLLE1BQU1tRSxNQUFNLElBQUksSUFBSSxDQUFDNUYsT0FBTyxFQUFFO01BQ2pDLElBQUksSUFBQThGLGtCQUFVLEVBQUNyRSxJQUFJLEVBQUVtRSxNQUFNLEVBQUUsSUFBSSxDQUFDN0YsTUFBTSxDQUFDZ0csUUFBUSxDQUFDLElBQUk2RCxvQkFBb0IsRUFBRTtRQUMxRUQsT0FBTyxDQUFDSixJQUFJLENBQUMsSUFBSSxDQUFDdkosT0FBTyxDQUFDNEYsTUFBTSxDQUFDLENBQUM7TUFDcEM7SUFDRjtJQUVBbUMsY0FBSyxDQUFDK0IsR0FBRyxDQUNQSCxPQUFPLEVBQ1AsQ0FBQ0ksTUFBb0IsRUFBRTNCLEVBQUUsS0FBVztNQUNsQyxNQUFNNEIsUUFBUSxHQUFHL0IsTUFBTSxDQUFDZ0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFdEQsT0FBTyxDQUFDO01BQzNDLE1BQU11RCxVQUFVLEdBQUdULFdBQVcsQ0FBQ1UsUUFBUSxDQUFDSixNQUFNLENBQUNLLE1BQU0sQ0FBQztNQUV0RCxJQUFJLElBQUFDLGVBQVEsRUFBQ0gsVUFBVSxDQUFDLEVBQUU7UUFDeEIsTUFBTUksT0FBTyxHQUFHSixVQUFVLENBQUNJLE9BQU87UUFFbEMsSUFBSUEsT0FBTyxJQUFJQyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLE9BQU8sR0FBR1AsTUFBTSxDQUFDVSxNQUFNLEVBQUU7VUFDbkQsT0FBT3JDLEVBQUUsQ0FBQyxDQUFDO1FBQ2I7UUFFQTRCLFFBQVEsQ0FBQ1UsSUFBSSxHQUFHUixVQUFVLENBQUNRLElBQUk7TUFDakM7TUFFQVgsTUFBTSxDQUFDWSxpQkFBaUIsQ0FBQ2xKLElBQUksRUFBRXVJLFFBQVEsRUFBRSxDQUFDdEgsR0FBRyxFQUFFa0ksY0FBYyxFQUFFQyxJQUFJLEtBQVc7UUFDNUUsSUFBSW5JLEdBQUcsSUFBSUEsR0FBRyxDQUFDb0ksWUFBWSxLQUFLLEdBQUcsRUFBRTtVQUNuQ1osVUFBVSxDQUFDSSxPQUFPLEdBQUdDLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUM7UUFDakM7UUFFQSxJQUFJOUgsR0FBRyxJQUFJLENBQUNrSSxjQUFjLEVBQUU7VUFDMUIsT0FBT3hDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQzFGLEdBQUcsSUFBSXFJLGdCQUFTLENBQUNDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDakU7UUFFQSxJQUFJO1VBQ0ZKLGNBQWMsR0FBR0sscUJBQWUsQ0FBQ0MsaUJBQWlCLENBQUNOLGNBQWMsRUFBRW5KLElBQUksQ0FBQztRQUMxRSxDQUFDLENBQUMsT0FBT2lCLEdBQUcsRUFBRTtVQUNaNEIsSUFBSSxDQUFDcEUsTUFBTSxDQUFDK0QsS0FBSyxDQUNmO1lBQ0VrSCxHQUFHLEVBQUUsS0FBSztZQUNWekksR0FBRyxFQUFFQTtVQUNQLENBQUMsRUFDRCw2REFDRixDQUFDO1VBQ0QsT0FBTzBGLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQzFGLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCO1FBRUErRyxXQUFXLENBQUNVLFFBQVEsQ0FBQ0osTUFBTSxDQUFDSyxNQUFNLENBQUMsR0FBRztVQUNwQ00sSUFBSSxFQUFFRyxJQUFJO1VBQ1ZQLE9BQU8sRUFBRUMsSUFBSSxDQUFDQyxHQUFHLENBQUM7UUFDcEIsQ0FBQztRQUVEZixXQUFXLEdBQUcsSUFBQTJCLHNDQUF3QixFQUFDM0IsV0FBVyxFQUFFbUIsY0FBYyxDQUFDO1FBRW5FLElBQUFTLHNDQUEwQixFQUFDVCxjQUFjLENBQUN6QixRQUFRLEVBQUVZLE1BQU0sQ0FBQztRQUUzRCxJQUFJO1VBQ0YsSUFBQXVCLDRCQUFhLEVBQUM3QixXQUFXLEVBQUVtQixjQUFjLENBQUM7UUFDNUMsQ0FBQyxDQUFDLE9BQU9sSSxHQUFHLEVBQUU7VUFDWjRCLElBQUksQ0FBQ3BFLE1BQU0sQ0FBQytELEtBQUssQ0FDZjtZQUNFa0gsR0FBRyxFQUFFLEtBQUs7WUFDVnpJLEdBQUcsRUFBRUE7VUFDUCxDQUFDLEVBQ0QsMERBQ0YsQ0FBQztVQUNELE9BQU8wRixFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMxRixHQUFHLENBQUMsQ0FBQztRQUN4Qjs7UUFFQTtRQUNBO1FBQ0FnSCxLQUFLLEdBQUcsSUFBSTtRQUNadEIsRUFBRSxDQUFDLENBQUM7TUFDTixDQUFDLENBQUM7SUFDSixDQUFDO0lBQ0Q7SUFDQSxDQUFDMUYsR0FBVSxFQUFFNkksYUFBa0IsS0FBK0M7TUFDNUUsSUFBQWxLLGVBQU0sRUFBQyxDQUFDcUIsR0FBRyxJQUFJOEksS0FBSyxDQUFDQyxPQUFPLENBQUNGLGFBQWEsQ0FBQyxDQUFDOztNQUU1QztNQUNBO01BQ0EsSUFBSSxDQUFDN0IsS0FBSyxFQUFFO1FBQ1YsSUFBSWdDLGtCQUFrQjtRQUN0QixLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0osYUFBYSxDQUFDdEssTUFBTSxFQUFFMEssQ0FBQyxFQUFFLEVBQUU7VUFDN0MsSUFBSUosYUFBYSxDQUFDSSxDQUFDLENBQUMsRUFBRTtZQUNwQixLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0wsYUFBYSxDQUFDSSxDQUFDLENBQUMsQ0FBQzFLLE1BQU0sRUFBRTJLLENBQUMsRUFBRSxFQUFFO2NBQ2hELElBQUlMLGFBQWEsQ0FBQ0ksQ0FBQyxDQUFDLENBQUNDLENBQUMsQ0FBQyxFQUFFO2dCQUN2QixNQUFNQyxJQUFJLEdBQUdOLGFBQWEsQ0FBQ0ksQ0FBQyxDQUFDLENBQUNDLENBQUMsQ0FBQyxDQUFDQyxJQUFJO2dCQUNyQyxJQUFJQSxJQUFJLEtBQUssV0FBVyxJQUFJQSxJQUFJLEtBQUssaUJBQWlCLElBQUlBLElBQUksS0FBSyxZQUFZLEVBQUU7a0JBQy9FSCxrQkFBa0IsR0FBRyxJQUFJO2tCQUN6QjtnQkFDRjtjQUNGO1lBQ0Y7VUFDRjtRQUNGO1FBRUEsSUFBSUEsa0JBQWtCLEVBQUU7VUFDdEIsT0FBT3ZKLFFBQVEsQ0FBQzRJLGdCQUFTLENBQUNlLHFCQUFxQixDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUVQLGFBQWEsQ0FBQztRQUN6RTtRQUNBLE9BQU9wSixRQUFRLENBQUM0SSxnQkFBUyxDQUFDZ0IsV0FBVyxDQUFDQyxvQkFBUyxDQUFDQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUVWLGFBQWEsQ0FBQztNQUNuRjtNQUVBLElBQUk1QixPQUFPLENBQUMxSSxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLE9BQU9rQixRQUFRLENBQUMsSUFBSSxFQUFFc0gsV0FBVyxDQUFDO01BQ3BDO01BRUFuRixJQUFJLENBQUNuRSxZQUFZLENBQUMrTCxjQUFjLENBQzlCekssSUFBSSxFQUNKZ0ksV0FBVyxFQUNYLE9BQU8vRyxHQUFHLEVBQUV5SixnQkFBeUIsS0FBbUI7UUFDdEQsSUFBSXpKLEdBQUcsRUFBRTtVQUNQLE9BQU9QLFFBQVEsQ0FBQ08sR0FBRyxDQUFDO1FBQ3RCO1FBQ0E7UUFDQTtRQUNBLE1BQU0wSixZQUFxQixHQUFHLEVBQUU7UUFDaEM7UUFDQSxLQUFLLE1BQU1ySixNQUFNLElBQUl1QixJQUFJLENBQUNqRSxPQUFPLElBQUksRUFBRSxFQUFFO1VBQ3ZDLElBQUk7WUFDRjtZQUNBO1lBQ0E4TCxnQkFBZ0IsR0FBRyxNQUFNcEosTUFBTSxDQUFDbkMsZUFBZSxDQUFDdUwsZ0JBQWdCLENBQUM7VUFDbkUsQ0FBQyxDQUFDLE9BQU96SixHQUFRLEVBQUU7WUFDakIwSixZQUFZLENBQUM3QyxJQUFJLENBQUM3RyxHQUFHLENBQUM7VUFDeEI7UUFDRjtRQUNBUCxRQUFRLENBQUMsSUFBSSxFQUFFZ0ssZ0JBQWdCLEVBQUVoTCxlQUFDLENBQUNrTCxNQUFNLENBQUNkLGFBQWEsRUFBRWEsWUFBWSxDQUFDLENBQUM7TUFDekUsQ0FDRixDQUFDO0lBQ0gsQ0FDRixDQUFDO0VBQ0g7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ1NFLDJCQUEyQkEsQ0FBQ25ELFFBQWtCLEVBQUVZLE1BQW9CLEVBQVE7SUFDakYsS0FBSyxNQUFNNEIsQ0FBQyxJQUFJeEMsUUFBUSxFQUFFO01BQ3hCLElBQUlsQixNQUFNLENBQUNzRSxTQUFTLENBQUNDLGNBQWMsQ0FBQ0MsSUFBSSxDQUFDdEQsUUFBUSxFQUFFd0MsQ0FBQyxDQUFDLEVBQUU7UUFDckQsTUFBTXJJLE9BQU8sR0FBRzZGLFFBQVEsQ0FBQ3dDLENBQUMsQ0FBQzs7UUFFM0I7UUFDQXJJLE9BQU8sQ0FBQ29KLE1BQU0sQ0FBQ0MsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUMsR0FBRzVDLE1BQU0sQ0FBQ0ssTUFBTTtNQUMzRDtJQUNGO0VBQ0Y7QUFDRjtBQUFDLElBQUF3QyxRQUFBLEdBQUFDLE9BQUEsQ0FBQW5OLE9BQUEsR0FFY0csT0FBTyIsImlnbm9yZUxpc3QiOltdfQ==