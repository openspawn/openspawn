"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _async = _interopRequireDefault(require("async"));
var _mkdirp = _interopRequireDefault(require("mkdirp"));
var _core = require("@verdaccio/core");
var _localFs = _interopRequireWildcard(require("./local-fs"));
var _pkgUtils = require("./pkg-utils");
var _token = _interopRequireDefault(require("./token"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const DEPRECATED_DB_NAME = '.sinopia-db.json';
const DB_NAME = '.verdaccio-db.json';
const debug = (0, _debug.default)('verdaccio:plugin:local-storage-legacy');
class LocalDatabase extends _token.default {
  constructor(config, logger) {
    super(config);
    _defineProperty(this, "path", void 0);
    _defineProperty(this, "logger", void 0);
    _defineProperty(this, "data", void 0);
    _defineProperty(this, "config", void 0);
    _defineProperty(this, "locked", void 0);
    this.config = config;
    this.path = this._buildStoragePath(config);
    this.logger = logger;
    this.locked = false;
    this.data = this._fetchLocalPackages();
    this._sync();
  }
  getSecret() {
    return Promise.resolve(this.data.secret);
  }
  setSecret(secret) {
    return new Promise(resolve => {
      this.data.secret = secret;
      resolve(this._sync());
    });
  }
  add(name, cb) {
    if (this.data.list.indexOf(name) === -1) {
      this.data.list.push(name);
      debug('the private package %o has been added', name);
      cb(this._sync());
    } else {
      debug('the private package %o was not added', name);
      cb(null);
    }
  }
  search(onPackage, onEnd, validateName) {
    const storages = this._getCustomPackageLocalStorages();
    debug(`search custom local packages: %o`, JSON.stringify(storages));
    const base = _path.default.dirname(this.config.self_path);
    const self = this;
    const storageKeys = Object.keys(storages);
    debug(`search base: %o keys: %o`, base, storageKeys);
    _async.default.eachSeries(storageKeys, function (storage, cb) {
      const position = storageKeys.indexOf(storage);
      const base2 = _path.default.join(position !== 0 ? storageKeys[0] : '');
      const storagePath = _path.default.resolve(base, base2, storage);
      debug('search path: %o : %o', storagePath, storage);
      _fs.default.readdir(storagePath, (err, files) => {
        if (err) {
          return cb(err);
        }
        _async.default.eachSeries(files, function (file, cb) {
          debug('local-storage: [search] search file path: %o', file);
          if (storageKeys.includes(file)) {
            return cb();
          }
          if (file.match(/^@/)) {
            // scoped
            const fileLocation = _path.default.resolve(base, storage, file);
            debug('search scoped file location: %o', fileLocation);
            _fs.default.readdir(fileLocation, function (err, files) {
              if (err) {
                return cb(err);
              }
              _async.default.eachSeries(files, (file2, cb) => {
                if (validateName(file2)) {
                  const packagePath = _path.default.resolve(base, storage, file, file2);
                  _fs.default.stat(packagePath, (err, stats) => {
                    if (_lodash.default.isNil(err) === false) {
                      return cb(err);
                    }
                    const item = {
                      name: `${file}/${file2}`,
                      path: packagePath,
                      time: stats.mtime.getTime()
                    };
                    onPackage(item, cb);
                  });
                } else {
                  cb();
                }
              }, cb);
            });
          } else if (validateName(file)) {
            const base2 = _path.default.join(position !== 0 ? storageKeys[0] : '');
            const packagePath = _path.default.resolve(base, base2, storage, file);
            debug('search file location: %o', packagePath);
            _fs.default.stat(packagePath, (err, stats) => {
              if (_lodash.default.isNil(err) === false) {
                return cb(err);
              }
              onPackage({
                name: file,
                path: packagePath,
                time: self.getTime(stats.mtime.getTime(), stats.mtime)
              }, cb);
            });
          } else {
            cb();
          }
        }, cb);
      });
    },
    // @ts-ignore
    onEnd);
  }
  remove(name, cb) {
    this.get((err, data) => {
      if (err) {
        cb(_core.errorUtils.getInternalError('error remove private package'));
        this.logger.error({
          err
        }, 'remove the private package has failed @{err}');
        debug('error on remove package %o', name);
      }
      const pkgName = data.indexOf(name);
      if (pkgName !== -1) {
        this.data.list.splice(pkgName, 1);
        debug('remove package %o has been removed', name);
      }
      cb(this._sync());
    });
  }

  /**
   * Return all database elements.
   * @return {Array}
   */
  get(cb) {
    const list = this.data.list;
    const totalItems = this.data.list.length;
    cb(null, list);
    debug('get full list of packages (%o) has been fetched', totalItems);
  }
  getPackageStorage(packageName) {
    const packageAccess = this.config.getMatchedPackagesSpec(packageName);
    const packagePath = this._getLocalStoragePath(packageAccess ? packageAccess.storage : undefined);
    debug('storage path selected: ', packagePath);
    if (_lodash.default.isString(packagePath) === false) {
      debug('the package %o has no storage defined ', packageName);
      return;
    }
    const packageStoragePath = _path.default.join(_path.default.resolve(_path.default.dirname(this.config.self_path || ''), packagePath), packageName);
    debug('storage absolute path: ', packageStoragePath);
    return new _localFs.default(packageStoragePath, this.logger);
  }
  clean() {
    this._sync();
  }
  getTime(time, mtime) {
    return time ? time : mtime;
  }
  _getCustomPackageLocalStorages() {
    const storages = {};

    // add custom storage if exist
    if (this.config.storage) {
      storages[this.config.storage] = true;
    }
    const {
      packages
    } = this.config;
    if (packages) {
      const listPackagesConf = Object.keys(packages || {});
      listPackagesConf.map(pkg => {
        const storage = packages[pkg].storage;
        if (storage) {
          storages[storage] = false;
        }
      });
    }
    return storages;
  }

  /**
   * Syncronize {create} database whether does not exist.
   * @return {Error|*}
   */
  _sync() {
    debug('sync database started');
    if (this.locked) {
      this.logger.error('Database is locked, please check error message printed during startup to ' + 'prevent data loss.');
      return new Error('Verdaccio database is locked, please contact your administrator to checkout ' + 'logs during verdaccio startup.');
    }
    // Uses sync to prevent ugly race condition
    try {
      // https://www.npmjs.com/package/mkdirp#mkdirpsyncdir-opts
      const folderName = _path.default.dirname(this.path);
      _mkdirp.default.sync(folderName);
      debug('sync folder %o created succeed', folderName);
    } catch (err) {
      debug('sync create folder has failed with error: %o', err);
      return null;
    }
    try {
      _fs.default.writeFileSync(this.path, JSON.stringify(this.data));
      debug('sync write succeed');
      return null;
    } catch (err) {
      debug('sync failed %o', err);
      return err;
    }
  }

  /**
   * Verify the right local storage location.
   * @param {String} path
   * @return {String}
   * @private
   */
  _getLocalStoragePath(storage) {
    const globalConfigStorage = this.config ? this.config.storage : undefined;
    if (_lodash.default.isNil(globalConfigStorage)) {
      throw new Error('global storage is required for this plugin');
    } else {
      if (_lodash.default.isNil(storage) === false && _lodash.default.isString(storage)) {
        return _path.default.join(globalConfigStorage, storage);
      }
      return globalConfigStorage;
    }
  }

  /**
   * Build the local database path.
   * @param {Object} config
   * @return {string|String|*}
   * @private
   */
  _buildStoragePath(config) {
    const sinopiadbPath = this._dbGenPath(DEPRECATED_DB_NAME, config);
    try {
      _fs.default.accessSync(sinopiadbPath, _fs.default.constants.F_OK);
      // @ts-ignore
      process.emitWarning('Database name deprecated!', {
        code: 'VERCODE01',
        detail: `Please rename database name from ${DEPRECATED_DB_NAME} to ${DB_NAME}`
      });
      return sinopiadbPath;
    } catch (err) {
      if (err.code === _localFs.noSuchFile) {
        return this._dbGenPath(DB_NAME, config);
      }
      throw err;
    }
  }

  /**
   * Fetch local packages.
   * @private
   * @return {Object}
   */
  _fetchLocalPackages() {
    const list = [];
    const emptyDatabase = {
      list,
      secret: ''
    };
    try {
      return (0, _pkgUtils.loadPrivatePackages)(this.path, this.logger);
    } catch (err) {
      // readFileSync is platform specific, macOS, Linux and Windows thrown an error
      // Only recreate if file not found to prevent data loss
      if (err.code !== _localFs.noSuchFile) {
        this.locked = true;
        this.logger.error('Failed to read package database file, please check the error printed below:\n', `File Path: ${this.path}\n\n ${err.message}`);
      }
      return emptyDatabase;
    }
  }
}
var _default = exports.default = LocalDatabase;
//# sourceMappingURL=local-database.js.map