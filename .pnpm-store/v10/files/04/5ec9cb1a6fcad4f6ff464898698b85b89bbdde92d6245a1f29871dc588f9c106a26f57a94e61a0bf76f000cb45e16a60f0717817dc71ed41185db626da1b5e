"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _assert = _interopRequireDefault(require("assert"));
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _url = _interopRequireDefault(require("url"));
var _streams = require("@verdaccio/streams");
var _utils = require("@verdaccio/utils");
var _constants = require("./constants");
var _storageUtils = require("./storage-utils");
var _utils2 = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:local-storage');
/**
 * Implements Storage interface (same for storage.js, local-storage.js, up-storage.js).
 */
class LocalStorage {
  constructor(config, logger, localStorage) {
    this.logger = logger;
    this.config = config;
    this.storagePlugin = localStorage;
  }
  addPackage(name, pkg, callback) {
    const storage = this._getLocalStorage(name);
    if (_lodash.default.isNil(storage)) {
      return callback(_utils2.ErrorCode.getNotFound('this package cannot be added'));
    }
    storage.createPackage(name, (0, _storageUtils.generatePackageTemplate)(name), err => {
      // FIXME: it will be fixed here https://github.com/verdaccio/verdaccio/pull/1360
      // @ts-ignore
      if (_lodash.default.isNull(err) === false && (err.code === _constants.STORAGE.FILE_EXIST_ERROR || err.code === _constants.HTTP_STATUS.CONFLICT)) {
        return callback(_utils2.ErrorCode.getConflict());
      }
      const latest = (0, _utils.getLatestVersion)(pkg);
      if (_lodash.default.isNil(latest) === false && pkg.versions[latest]) {
        return callback(null, pkg.versions[latest]);
      }
      return callback();
    });
  }

  /**
   * Remove package.
   * @param {*} name
   * @param {*} callback
   * @return {Function}
   */
  removePackage(name, callback) {
    const storage = this._getLocalStorage(name);
    debug('[storage] removing package %o', name);
    if (_lodash.default.isNil(storage)) {
      return callback(_utils2.ErrorCode.getNotFound());
    }
    storage.readPackage(name, (err, data) => {
      if (_lodash.default.isNil(err) === false) {
        if (err.code === _constants.STORAGE.NO_SUCH_FILE_ERROR || err.code === _constants.HTTP_STATUS.NOT_FOUND) {
          return callback(_utils2.ErrorCode.getNotFound());
        }
        return callback(err);
      }
      data = (0, _storageUtils.normalizePackage)(data);
      this.storagePlugin.remove(name, removeFailed => {
        if (removeFailed) {
          // This will happen when database is locked
          this.logger.error({
            name
          }, `[storage/removePackage] the database is locked, removed has failed for @{name}`);
          return callback(_utils2.ErrorCode.getBadData(removeFailed.message));
        }
        storage.deletePackage(_constants.STORAGE.PACKAGE_FILE_NAME, err => {
          if (err) {
            return callback(err);
          }
          const attachments = Object.keys(data._attachments);
          this._deleteAttachments(storage, attachments, callback);
        });
      });
    });
  }

  /**
   * Synchronize remote package info with the local one
   * @param {*} name
   * @param {*} packageInfo
   * @param {*} callback
   */
  updateVersions(name, packageInfo, callback) {
    this._readCreatePackage(name, (err, packageLocalJson) => {
      if (err) {
        return callback(err);
      }
      let change = false;
      // updating readme
      packageLocalJson.readme = (0, _storageUtils.getLatestReadme)(packageInfo);
      if (packageInfo.readme !== packageLocalJson.readme) {
        change = true;
      }
      for (const versionId in packageInfo.versions) {
        if (_lodash.default.isNil(packageLocalJson.versions[versionId])) {
          let version = packageInfo.versions[versionId];

          // we don't keep readme for package versions,
          // only one readme per package
          version = (0, _storageUtils.cleanUpReadme)(version);
          version.contributors = (0, _utils.normalizeContributors)(version.contributors);
          change = true;
          packageLocalJson.versions[versionId] = version;
          if (version.dist && version.dist.tarball) {
            const urlObject = _url.default.parse(version.dist.tarball);
            const filename = urlObject.pathname.replace(/^.*\//, '');

            // we do NOT overwrite any existing records
            if (_lodash.default.isNil(packageLocalJson._distfiles[filename])) {
              const hash = packageLocalJson._distfiles[filename] = {
                url: version.dist.tarball,
                sha: version.dist.shasum
              };
              /* eslint spaced-comment: 0 */
              const upLink = version[Symbol.for('__verdaccio_uplink')];
              if (_lodash.default.isNil(upLink) === false) {
                this._updateUplinkToRemoteProtocol(hash, upLink);
              }
            }
          }
        }
      }
      for (const tag in packageInfo[_constants.DIST_TAGS]) {
        if (!packageLocalJson[_constants.DIST_TAGS][tag] || packageLocalJson[_constants.DIST_TAGS][tag] !== packageInfo[_constants.DIST_TAGS][tag]) {
          change = true;
          packageLocalJson[_constants.DIST_TAGS][tag] = packageInfo[_constants.DIST_TAGS][tag];
        }
      }
      for (const up in packageInfo._uplinks) {
        if (Object.prototype.hasOwnProperty.call(packageInfo._uplinks, up)) {
          const need_change = !(0, _utils2.isObject)(packageLocalJson._uplinks[up]) || packageInfo._uplinks[up].etag !== packageLocalJson._uplinks[up].etag || packageInfo._uplinks[up].fetched !== packageLocalJson._uplinks[up].fetched;
          if (need_change) {
            change = true;
            packageLocalJson._uplinks[up] = packageInfo._uplinks[up];
          }
        }
      }
      if ('time' in packageInfo && !_lodash.default.isEqual(packageLocalJson.time, packageInfo.time)) {
        packageLocalJson.time = packageInfo.time;
        change = true;
      }
      if (change) {
        debug('updating package %o info', name);
        this._writePackage(name, packageLocalJson, function (err) {
          callback(err, packageLocalJson);
        });
      } else {
        callback(null, packageLocalJson);
      }
    });
  }

  /**
   * Add a new version to a previous local package.
   * @param {*} name
   * @param {*} version
   * @param {*} metadata
   * @param {*} tag
   * @param {*} callback
   */
  addVersion(name, version, metadata, tag, callback) {
    this._updatePackage(name, (data, cb) => {
      // keep only one readme per package
      data.readme = metadata.readme;

      // TODO: lodash remove
      metadata = (0, _storageUtils.cleanUpReadme)(metadata);
      metadata.contributors = (0, _utils.normalizeContributors)(metadata.contributors);
      const hasVersion = data.versions[version] != null;
      if (hasVersion) {
        return cb(_utils2.ErrorCode.getConflict());
      }

      // if uploaded tarball has a different shasum, it's very likely that we have some kind of error
      if ((0, _utils2.isObject)(metadata.dist) && _lodash.default.isString(metadata.dist.tarball)) {
        const tarball = metadata.dist.tarball.replace(/.*\//, '');
        if ((0, _utils2.isObject)(data._attachments[tarball])) {
          if (_lodash.default.isNil(data._attachments[tarball].shasum) === false && _lodash.default.isNil(metadata.dist.shasum) === false) {
            if (data._attachments[tarball].shasum != metadata.dist.shasum) {
              const errorMessage = `shasum error, ${data._attachments[tarball].shasum} != ${metadata.dist.shasum}`;
              return cb(_utils2.ErrorCode.getBadRequest(errorMessage));
            }
          }
          const currentDate = new Date().toISOString();

          // some old storage do not have this field #740
          if (_lodash.default.isNil(data.time)) {
            data.time = {};
          }
          data.time['modified'] = currentDate;
          if ('created' in data.time === false) {
            data.time.created = currentDate;
          }
          data.time[version] = currentDate;
          data._attachments[tarball].version = version;
        }
      }
      data.versions[version] = metadata;
      (0, _utils2.tagVersion)(data, version, tag);
      this.storagePlugin.add(name, addFailed => {
        if (addFailed) {
          return cb(_utils2.ErrorCode.getBadData(addFailed.message));
        }
        cb();
      });
    }, callback);
  }

  /**
   * Merge a new list of tags for a local packages with the existing one.
   * @param {*} pkgName
   * @param {*} tags
   * @param {*} callback
   */
  mergeTags(pkgName, tags, callback) {
    this._updatePackage(pkgName, (data, cb) => {
      /* eslint guard-for-in: 0 */
      for (const tag in tags) {
        // this handle dist-tag rm command
        if (_lodash.default.isNull(tags[tag])) {
          delete data[_constants.DIST_TAGS][tag];
          continue;
        }
        if (_lodash.default.isNil(data.versions[tags[tag]])) {
          return cb(this._getVersionNotFound());
        }
        const version = tags[tag];
        (0, _utils2.tagVersion)(data, version, tag);
      }
      cb(null);
    }, callback);
  }

  /**
   * Return version not found
   * @return {String}
   * @private
   */
  _getVersionNotFound() {
    return _utils2.ErrorCode.getNotFound(_constants.API_ERROR.VERSION_NOT_EXIST);
  }

  /**
   * Return file no available
   * @return {String}
   * @private
   */
  _getFileNotAvailable() {
    return _utils2.ErrorCode.getNotFound('no such file available');
  }

  /**
   * Update the package metadata, tags and attachments (tarballs).
   * Note: Currently supports unpublishing and deprecation.
   * @param {*} name
   * @param {*} incomingPkg
   * @param {*} revision
   * @param {*} callback
   * @return {Function}
   */
  changePackage(name, incomingPkg, revision, callback) {
    if (!(0, _utils2.isObject)(incomingPkg.versions) || !(0, _utils2.isObject)(incomingPkg[_constants.DIST_TAGS])) {
      this.logger.error({
        name
      }, `changePackage bad data for @{name}`);
      return callback(_utils2.ErrorCode.getBadData());
    }
    debug('changePackage udapting package for %o', name);
    this._updatePackage(name, (localData, cb) => {
      for (const version in localData.versions) {
        const incomingVersion = incomingPkg.versions[version];
        if (_lodash.default.isNil(incomingVersion)) {
          this.logger.info({
            name: name,
            version: version
          }, 'unpublishing @{name}@@{version}');

          // FIXME: I prefer return a new object rather mutate the metadata
          delete localData.versions[version];
          delete localData.time[version];
          for (const file in localData._attachments) {
            if (localData._attachments[file].version === version) {
              delete localData._attachments[file].version;
            }
          }
        } else if (Object.prototype.hasOwnProperty.call(incomingVersion, 'deprecated')) {
          const incomingDeprecated = incomingVersion.deprecated;
          if (incomingDeprecated != localData.versions[version].deprecated) {
            if (!incomingDeprecated) {
              this.logger.info({
                name: name,
                version: version
              }, 'undeprecating @{name}@@{version}');
              delete localData.versions[version].deprecated;
            } else {
              this.logger.info({
                name: name,
                version: version
              }, 'deprecating @{name}@@{version}');
              localData.versions[version].deprecated = incomingDeprecated;
            }
            localData.time.modified = new Date().toISOString();
          }
        }
      }
      localData[_constants.USERS] = incomingPkg[_constants.USERS];
      localData[_constants.DIST_TAGS] = incomingPkg[_constants.DIST_TAGS];
      cb(null);
    }, function (err) {
      if (err) {
        return callback(err);
      }
      callback();
    });
  }
  /**
   * Remove a tarball.
   * @param {*} name
   * @param {*} filename
   * @param {*} revision
   * @param {*} callback
   */
  removeTarball(name, filename, revision, callback) {
    (0, _assert.default)((0, _utils.validateName)(filename));
    this._updatePackage(name, (data, cb) => {
      if (data._attachments[filename]) {
        delete data._attachments[filename];
        cb(null);
      } else {
        cb(this._getFileNotAvailable());
      }
    }, err => {
      if (err) {
        return callback(err);
      }
      const storage = this._getLocalStorage(name);
      if (storage) {
        storage.deletePackage(filename, callback);
      }
    });
  }

  /**
   * Add a tarball.
   * @param {String} name
   * @param {String} filename
   * @return {Stream}
   */
  addTarball(name, filename) {
    (0, _assert.default)((0, _utils.validateName)(filename));
    let length = 0;
    const shaOneHash = (0, _utils.createTarballHash)();
    const uploadStream = new _streams.UploadTarball({});
    const _transform = uploadStream._transform;
    const storage = this._getLocalStorage(name);
    uploadStream.abort = function () {};
    uploadStream.done = function () {};
    uploadStream._transform = function (data, ...args) {
      shaOneHash.update(data);
      // measure the length for validation reasons
      length += data.length;
      const appliedData = [data, ...args];
      // FIXME: not sure about this approach, tsc complains
      // @ts-ignore
      _transform.apply(uploadStream, appliedData);
    };
    if (name === '__proto__') {
      process.nextTick(() => {
        uploadStream.emit('error', _utils2.ErrorCode.getForbidden());
      });
      return uploadStream;
    }
    if (!storage) {
      process.nextTick(() => {
        uploadStream.emit('error', "can't upload this package");
      });
      return uploadStream;
    }
    const writeStream = storage.writeTarball(filename);
    writeStream.on('error', err => {
      if (err.code === _constants.STORAGE.FILE_EXIST_ERROR || err.code === _constants.HTTP_STATUS.CONFLICT) {
        uploadStream.emit('error', _utils2.ErrorCode.getConflict());
        uploadStream.abort();
      } else if (err.code === _constants.STORAGE.NO_SUCH_FILE_ERROR || err.code === _constants.HTTP_STATUS.NOT_FOUND) {
        // check if package exists to throw an appropriate message
        this.getPackageMetadata(name, function (_err) {
          if (_err) {
            uploadStream.emit('error', _err);
          } else {
            uploadStream.emit('error', err);
          }
        });
      } else {
        uploadStream.emit('error', err);
      }
    });
    writeStream.on('open', function () {
      // re-emitting open because it's handled in storage.js
      uploadStream.emit('open');
    });
    writeStream.on('success', () => {
      this._updatePackage(name, function updater(data, cb) {
        data._attachments[filename] = {
          shasum: shaOneHash.digest('hex')
        };
        cb(null);
      }, function (err) {
        if (err) {
          uploadStream.emit('error', err);
        } else {
          uploadStream.emit('success');
        }
      });
    });
    uploadStream.abort = function () {
      writeStream.abort();
    };
    uploadStream.done = function () {
      if (!length) {
        uploadStream.emit('error', _utils2.ErrorCode.getBadData('refusing to accept zero-length file'));
        writeStream.abort();
      } else {
        writeStream.done();
      }
    };
    uploadStream.pipe(writeStream);
    return uploadStream;
  }

  /**
   * Get a tarball.
   * @param {*} name
   * @param {*} filename
   * @return {ReadTarball}
   */
  getTarball(name, filename) {
    (0, _assert.default)((0, _utils.validateName)(filename));
    const storage = this._getLocalStorage(name);
    if (_lodash.default.isNil(storage)) {
      return this._createFailureStreamResponse();
    }
    return this._streamSuccessReadTarBall(storage, filename);
  }

  /**
   * Return a stream that emits a read failure.
   * @private
   * @return {ReadTarball}
   */
  _createFailureStreamResponse() {
    const stream = new _streams.ReadTarball({});
    process.nextTick(() => {
      stream.emit('error', this._getFileNotAvailable());
    });
    return stream;
  }

  /**
   * Return a stream that emits the tarball data
   * @param {Object} storage
   * @param {String} filename
   * @private
   * @return {ReadTarball}
   */
  _streamSuccessReadTarBall(storage, filename) {
    const stream = new _streams.ReadTarball({});
    const readTarballStream = storage.readTarball(filename);
    const e404 = _utils2.ErrorCode.getNotFound;
    stream.abort = function () {
      if (_lodash.default.isNil(readTarballStream) === false) {
        readTarballStream.abort();
      }
    };
    readTarballStream.on('error', function (err) {
      if (err.code === _constants.STORAGE.NO_SUCH_FILE_ERROR || err.code === _constants.HTTP_STATUS.NOT_FOUND) {
        stream.emit('error', e404('no such file available'));
      } else {
        stream.emit('error', err);
      }
    });
    readTarballStream.on('content-length', function (content) {
      stream.emit('content-length', content);
    });
    readTarballStream.on('open', function () {
      // re-emitting open because it's handled in storage.js
      stream.emit('open');
      readTarballStream.pipe(stream);
    });
    return stream;
  }

  /**
   * Retrieve a package by name.
   * @param {*} name
   * @param {*} callback
   * @return {Function}
   */
  getPackageMetadata(name, callback = () => {}) {
    const storage = this._getLocalStorage(name);
    if (_lodash.default.isNil(storage)) {
      return callback(_utils2.ErrorCode.getNotFound());
    }
    this._readPackage(name, storage, callback);
  }

  /**
   * Search a local package.
   * @param {*} startKey
   * @param {*} options
   * @return {Function}
   */
  search(startKey, options) {
    debug('options for search %o', options);
    const stream = new _streams.ReadTarball({
      objectMode: true
    });
    this._searchEachPackage((item, cb) => {
      // @ts-ignore
      if (item.time > parseInt(startKey, 10)) {
        this.getPackageMetadata(item.name, (err, data) => {
          if (err) {
            return cb(err);
          }

          // @ts-ignore
          const time = new Date(item.time).toISOString();
          const result = (0, _storageUtils.prepareSearchPackage)(data, time);
          if (_lodash.default.isNil(result) === false) {
            stream.push(result);
          }
          cb(null);
        });
      } else {
        cb(null);
      }
    }, function onEnd(err) {
      if (err) {
        stream.emit('error', err);
        return;
      }
      stream.end();
    });
    return stream;
  }

  /**
   * Retrieve a wrapper that provide access to the package location.
   * @param {Object} pkgName package name.
   * @return {Object}
   */
  _getLocalStorage(pkgName) {
    return this.storagePlugin.getPackageStorage(pkgName);
  }

  /**
   * Read a json file from storage.
   * @param {Object} storage
   * @param {Function} callback
   */
  _readPackage(name, storage, callback) {
    storage.readPackage(name, (err, result) => {
      if (err) {
        if (err.code === _constants.STORAGE.NO_SUCH_FILE_ERROR || err.code === _constants.HTTP_STATUS.NOT_FOUND) {
          return callback(_utils2.ErrorCode.getNotFound());
        }
        return callback(this._internalError(err, _constants.STORAGE.PACKAGE_FILE_NAME, 'error reading'));
      }
      callback(err, (0, _storageUtils.normalizePackage)(result));
    });
  }

  /**
   * Walks through each package and calls `on_package` on them.
   * @param {*} onPackage
   * @param {*} onEnd
   */
  _searchEachPackage(onPackage, onEnd) {
    // save wait whether plugin still do not support search functionality
    if (_lodash.default.isNil(this.storagePlugin.search)) {
      this.logger.warn('plugin search not implemented yet');
      onEnd();
    } else {
      this.storagePlugin.search(onPackage, onEnd, _utils.validateName);
    }
  }

  /**
   * Retrieve either a previous created local package or a boilerplate.
   * @param {*} pkgName
   * @param {*} callback
   * @return {Function}
   */
  _readCreatePackage(pkgName, callback) {
    const storage = this._getLocalStorage(pkgName);
    if (_lodash.default.isNil(storage)) {
      this._createNewPackage(pkgName, callback);
      return;
    }
    storage.readPackage(pkgName, (err, data) => {
      // TODO: race condition
      if (_lodash.default.isNil(err) === false) {
        if (err.code === _constants.STORAGE.NO_SUCH_FILE_ERROR || err.code === _constants.HTTP_STATUS.NOT_FOUND) {
          data = (0, _storageUtils.generatePackageTemplate)(pkgName);
        } else {
          return callback(this._internalError(err, _constants.STORAGE.PACKAGE_FILE_NAME, 'error reading'));
        }
      }
      callback(null, (0, _storageUtils.normalizePackage)(data));
    });
  }
  _createNewPackage(name, callback) {
    return callback(null, (0, _storageUtils.normalizePackage)((0, _storageUtils.generatePackageTemplate)(name)));
  }

  /**
   * Handle internal error
   * @param {*} err
   * @param {*} file
   * @param {*} message
   * @return {Object} Error instance
   */
  _internalError(err, file, message) {
    this.logger.error({
      err: err,
      file: file
    }, `${message}  @{file}: @{!err.message}`);
    return _utils2.ErrorCode.getInternalError();
  }

  /**
   * @param {*} name package name
   * @param {*} updateHandler function(package, cb) - update function
   * @param {*} callback callback that gets invoked after it's all updated
   * @return {Function}
   */
  _updatePackage(name, updateHandler, callback) {
    const storage = this._getLocalStorage(name);
    if (!storage) {
      return callback(_utils2.ErrorCode.getNotFound());
    }
    storage.updatePackage(name, updateHandler, this._writePackage.bind(this), _storageUtils.normalizePackage, callback);
  }

  /**
   * Update the revision (_rev) string for a package.
   * @param {*} name
   * @param {*} json
   * @param {*} callback
   * @return {Function}
   */
  _writePackage(name, json, callback) {
    const storage = this._getLocalStorage(name);
    if (_lodash.default.isNil(storage)) {
      return callback();
    }
    storage.savePackage(name, this._setDefaultRevision(json), callback);
  }
  _setDefaultRevision(json) {
    // calculate revision from couch db
    if (_lodash.default.isString(json._rev) === false) {
      json._rev = _constants.STORAGE.DEFAULT_REVISION;
    }

    // this is intended in debug mode we do not want modify the store revision
    if (_lodash.default.isNil(this.config._debug)) {
      json._rev = (0, _storageUtils.generateRevision)(json._rev);
    }
    return json;
  }
  _deleteAttachments(storage, attachments, callback) {
    debug('[storage/_deleteAttachments] delete attachments total: %o', attachments?.length);
    const unlinkNext = function (cb) {
      if (_lodash.default.isEmpty(attachments)) {
        return cb();
      }
      const attachment = attachments.shift();
      storage.deletePackage(attachment, function () {
        unlinkNext(cb);
      });
    };
    unlinkNext(function () {
      // try to unlink the directory, but ignore errors because it can fail
      storage.removePackage(function (err) {
        callback(err);
      });
    });
  }

  /**
   * Ensure the dist file remains as the same protocol
   * @param {Object} hash metadata
   * @param {String} upLinkKey registry key
   * @private
   */
  _updateUplinkToRemoteProtocol(hash, upLinkKey) {
    // if we got this information from a known registry,
    // use the same protocol for the tarball
    //
    // see https://github.com/rlidwka/sinopia/issues/166
    const tarballUrl = _url.default.parse(hash.url);
    const uplinkUrl = _url.default.parse(this.config.uplinks[upLinkKey].url);
    if (uplinkUrl.host === tarballUrl.host) {
      tarballUrl.protocol = uplinkUrl.protocol;
      hash.registry = upLinkKey;
      hash.url = _url.default.format(tarballUrl);
    }
  }
  async getSecret(config) {
    const secretKey = await this.storagePlugin.getSecret();
    return this.storagePlugin.setSecret(config.checkSecretKey(secretKey));
  }
  saveToken(token) {
    if (_lodash.default.isFunction(this.storagePlugin.saveToken) === false) {
      return Promise.reject(_utils2.ErrorCode.getCode(_constants.HTTP_STATUS.SERVICE_UNAVAILABLE, _constants.SUPPORT_ERRORS.PLUGIN_MISSING_INTERFACE));
    }
    return this.storagePlugin.saveToken(token);
  }
  deleteToken(user, tokenKey) {
    if (_lodash.default.isFunction(this.storagePlugin.deleteToken) === false) {
      return Promise.reject(_utils2.ErrorCode.getCode(_constants.HTTP_STATUS.SERVICE_UNAVAILABLE, _constants.SUPPORT_ERRORS.PLUGIN_MISSING_INTERFACE));
    }
    return this.storagePlugin.deleteToken(user, tokenKey);
  }
  readTokens(filter) {
    if (_lodash.default.isFunction(this.storagePlugin.readTokens) === false) {
      return Promise.reject(_utils2.ErrorCode.getCode(_constants.HTTP_STATUS.SERVICE_UNAVAILABLE, _constants.SUPPORT_ERRORS.PLUGIN_MISSING_INTERFACE));
    }
    return this.storagePlugin.readTokens(filter);
  }
}
var _default = exports.default = LocalStorage;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfZGVidWciLCJfbG9kYXNoIiwiX3VybCIsIl9zdHJlYW1zIiwiX3V0aWxzIiwiX2NvbnN0YW50cyIsIl9zdG9yYWdlVXRpbHMiLCJfdXRpbHMyIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZGVidWciLCJidWlsRGVidWciLCJMb2NhbFN0b3JhZ2UiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsImxvZ2dlciIsImxvY2FsU3RvcmFnZSIsInN0b3JhZ2VQbHVnaW4iLCJhZGRQYWNrYWdlIiwibmFtZSIsInBrZyIsImNhbGxiYWNrIiwic3RvcmFnZSIsIl9nZXRMb2NhbFN0b3JhZ2UiLCJfIiwiaXNOaWwiLCJFcnJvckNvZGUiLCJnZXROb3RGb3VuZCIsImNyZWF0ZVBhY2thZ2UiLCJnZW5lcmF0ZVBhY2thZ2VUZW1wbGF0ZSIsImVyciIsImlzTnVsbCIsImNvZGUiLCJTVE9SQUdFIiwiRklMRV9FWElTVF9FUlJPUiIsIkhUVFBfU1RBVFVTIiwiQ09ORkxJQ1QiLCJnZXRDb25mbGljdCIsImxhdGVzdCIsImdldExhdGVzdFZlcnNpb24iLCJ2ZXJzaW9ucyIsInJlbW92ZVBhY2thZ2UiLCJyZWFkUGFja2FnZSIsImRhdGEiLCJOT19TVUNIX0ZJTEVfRVJST1IiLCJOT1RfRk9VTkQiLCJub3JtYWxpemVQYWNrYWdlIiwicmVtb3ZlIiwicmVtb3ZlRmFpbGVkIiwiZXJyb3IiLCJnZXRCYWREYXRhIiwibWVzc2FnZSIsImRlbGV0ZVBhY2thZ2UiLCJQQUNLQUdFX0ZJTEVfTkFNRSIsImF0dGFjaG1lbnRzIiwiT2JqZWN0Iiwia2V5cyIsIl9hdHRhY2htZW50cyIsIl9kZWxldGVBdHRhY2htZW50cyIsInVwZGF0ZVZlcnNpb25zIiwicGFja2FnZUluZm8iLCJfcmVhZENyZWF0ZVBhY2thZ2UiLCJwYWNrYWdlTG9jYWxKc29uIiwiY2hhbmdlIiwicmVhZG1lIiwiZ2V0TGF0ZXN0UmVhZG1lIiwidmVyc2lvbklkIiwidmVyc2lvbiIsImNsZWFuVXBSZWFkbWUiLCJjb250cmlidXRvcnMiLCJub3JtYWxpemVDb250cmlidXRvcnMiLCJkaXN0IiwidGFyYmFsbCIsInVybE9iamVjdCIsIlVybE5vZGUiLCJwYXJzZSIsImZpbGVuYW1lIiwicGF0aG5hbWUiLCJyZXBsYWNlIiwiX2Rpc3RmaWxlcyIsImhhc2giLCJ1cmwiLCJzaGEiLCJzaGFzdW0iLCJ1cExpbmsiLCJTeW1ib2wiLCJmb3IiLCJfdXBkYXRlVXBsaW5rVG9SZW1vdGVQcm90b2NvbCIsInRhZyIsIkRJU1RfVEFHUyIsInVwIiwiX3VwbGlua3MiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJuZWVkX2NoYW5nZSIsImlzT2JqZWN0IiwiZXRhZyIsImZldGNoZWQiLCJpc0VxdWFsIiwidGltZSIsIl93cml0ZVBhY2thZ2UiLCJhZGRWZXJzaW9uIiwibWV0YWRhdGEiLCJfdXBkYXRlUGFja2FnZSIsImNiIiwiaGFzVmVyc2lvbiIsImlzU3RyaW5nIiwiZXJyb3JNZXNzYWdlIiwiZ2V0QmFkUmVxdWVzdCIsImN1cnJlbnREYXRlIiwiRGF0ZSIsInRvSVNPU3RyaW5nIiwiY3JlYXRlZCIsInRhZ1ZlcnNpb24iLCJhZGQiLCJhZGRGYWlsZWQiLCJtZXJnZVRhZ3MiLCJwa2dOYW1lIiwidGFncyIsIl9nZXRWZXJzaW9uTm90Rm91bmQiLCJBUElfRVJST1IiLCJWRVJTSU9OX05PVF9FWElTVCIsIl9nZXRGaWxlTm90QXZhaWxhYmxlIiwiY2hhbmdlUGFja2FnZSIsImluY29taW5nUGtnIiwicmV2aXNpb24iLCJsb2NhbERhdGEiLCJpbmNvbWluZ1ZlcnNpb24iLCJpbmZvIiwiZmlsZSIsImluY29taW5nRGVwcmVjYXRlZCIsImRlcHJlY2F0ZWQiLCJtb2RpZmllZCIsIlVTRVJTIiwicmVtb3ZlVGFyYmFsbCIsImFzc2VydCIsInZhbGlkYXRlTmFtZSIsImFkZFRhcmJhbGwiLCJsZW5ndGgiLCJzaGFPbmVIYXNoIiwiY3JlYXRlVGFyYmFsbEhhc2giLCJ1cGxvYWRTdHJlYW0iLCJVcGxvYWRUYXJiYWxsIiwiX3RyYW5zZm9ybSIsImFib3J0IiwiZG9uZSIsImFyZ3MiLCJ1cGRhdGUiLCJhcHBsaWVkRGF0YSIsImFwcGx5IiwicHJvY2VzcyIsIm5leHRUaWNrIiwiZW1pdCIsImdldEZvcmJpZGRlbiIsIndyaXRlU3RyZWFtIiwid3JpdGVUYXJiYWxsIiwib24iLCJnZXRQYWNrYWdlTWV0YWRhdGEiLCJfZXJyIiwidXBkYXRlciIsImRpZ2VzdCIsInBpcGUiLCJnZXRUYXJiYWxsIiwiX2NyZWF0ZUZhaWx1cmVTdHJlYW1SZXNwb25zZSIsIl9zdHJlYW1TdWNjZXNzUmVhZFRhckJhbGwiLCJzdHJlYW0iLCJSZWFkVGFyYmFsbCIsInJlYWRUYXJiYWxsU3RyZWFtIiwicmVhZFRhcmJhbGwiLCJlNDA0IiwiY29udGVudCIsIl9yZWFkUGFja2FnZSIsInNlYXJjaCIsInN0YXJ0S2V5Iiwib3B0aW9ucyIsIm9iamVjdE1vZGUiLCJfc2VhcmNoRWFjaFBhY2thZ2UiLCJpdGVtIiwicGFyc2VJbnQiLCJyZXN1bHQiLCJwcmVwYXJlU2VhcmNoUGFja2FnZSIsInB1c2giLCJvbkVuZCIsImVuZCIsImdldFBhY2thZ2VTdG9yYWdlIiwiX2ludGVybmFsRXJyb3IiLCJvblBhY2thZ2UiLCJ3YXJuIiwiX2NyZWF0ZU5ld1BhY2thZ2UiLCJnZXRJbnRlcm5hbEVycm9yIiwidXBkYXRlSGFuZGxlciIsInVwZGF0ZVBhY2thZ2UiLCJiaW5kIiwianNvbiIsInNhdmVQYWNrYWdlIiwiX3NldERlZmF1bHRSZXZpc2lvbiIsIl9yZXYiLCJERUZBVUxUX1JFVklTSU9OIiwiZ2VuZXJhdGVSZXZpc2lvbiIsInVubGlua05leHQiLCJpc0VtcHR5IiwiYXR0YWNobWVudCIsInNoaWZ0IiwidXBMaW5rS2V5IiwidGFyYmFsbFVybCIsInVwbGlua1VybCIsInVwbGlua3MiLCJob3N0IiwicHJvdG9jb2wiLCJyZWdpc3RyeSIsImZvcm1hdCIsImdldFNlY3JldCIsInNlY3JldEtleSIsInNldFNlY3JldCIsImNoZWNrU2VjcmV0S2V5Iiwic2F2ZVRva2VuIiwidG9rZW4iLCJpc0Z1bmN0aW9uIiwiUHJvbWlzZSIsInJlamVjdCIsImdldENvZGUiLCJTRVJWSUNFX1VOQVZBSUxBQkxFIiwiU1VQUE9SVF9FUlJPUlMiLCJQTFVHSU5fTUlTU0lOR19JTlRFUkZBQ0UiLCJkZWxldGVUb2tlbiIsInVzZXIiLCJ0b2tlbktleSIsInJlYWRUb2tlbnMiLCJmaWx0ZXIiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2xvY2FsLXN0b3JhZ2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IGJ1aWxEZWJ1ZyBmcm9tICdkZWJ1Zyc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IFVybE5vZGUgZnJvbSAndXJsJztcblxuaW1wb3J0IHsgUmVhZFRhcmJhbGwsIFVwbG9hZFRhcmJhbGwgfSBmcm9tICdAdmVyZGFjY2lvL3N0cmVhbXMnO1xuaW1wb3J0IHtcbiAgQXV0aG9yLFxuICBDYWxsYmFjayxcbiAgQ29uZmlnLFxuICBEaXN0RmlsZSxcbiAgTG9nZ2VyLFxuICBNYW5pZmVzdCxcbiAgTWVyZ2VUYWdzLFxuICBTdG9yYWdlVXBkYXRlQ2FsbGJhY2ssXG4gIFRva2VuLFxuICBUb2tlbkZpbHRlcixcbiAgVmVyc2lvbixcbiAgb25FbmRTZWFyY2hQYWNrYWdlLFxuICBvblNlYXJjaFBhY2thZ2UsXG59IGZyb20gJ0B2ZXJkYWNjaW8vdHlwZXMnO1xuaW1wb3J0IHtcbiAgY3JlYXRlVGFyYmFsbEhhc2gsXG4gIGdldExhdGVzdFZlcnNpb24sXG4gIG5vcm1hbGl6ZUNvbnRyaWJ1dG9ycyxcbiAgdmFsaWRhdGVOYW1lLFxufSBmcm9tICdAdmVyZGFjY2lvL3V0aWxzJztcblxuaW1wb3J0IHsgU3RvcmFnZVBsdWdpbkxlZ2FjeSB9IGZyb20gJy4uLy4uL3R5cGVzL2N1c3RvbSc7XG5pbXBvcnQgeyBTdHJpbmdWYWx1ZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IEFQSV9FUlJPUiwgRElTVF9UQUdTLCBIVFRQX1NUQVRVUywgU1RPUkFHRSwgU1VQUE9SVF9FUlJPUlMsIFVTRVJTIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IHtcbiAgY2xlYW5VcFJlYWRtZSxcbiAgZ2VuZXJhdGVQYWNrYWdlVGVtcGxhdGUsXG4gIGdlbmVyYXRlUmV2aXNpb24sXG4gIGdldExhdGVzdFJlYWRtZSxcbiAgbm9ybWFsaXplUGFja2FnZSxcbn0gZnJvbSAnLi9zdG9yYWdlLXV0aWxzJztcbmltcG9ydCB7IHByZXBhcmVTZWFyY2hQYWNrYWdlIH0gZnJvbSAnLi9zdG9yYWdlLXV0aWxzJztcbmltcG9ydCB7IEVycm9yQ29kZSwgaXNPYmplY3QsIHRhZ1ZlcnNpb24gfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgZGVidWcgPSBidWlsRGVidWcoJ3ZlcmRhY2Npbzpsb2NhbC1zdG9yYWdlJyk7XG5leHBvcnQgdHlwZSBTdG9yYWdlUGx1Z2luID0gU3RvcmFnZVBsdWdpbkxlZ2FjeTxDb25maWc+IHwgYW55O1xuLyoqXG4gKiBJbXBsZW1lbnRzIFN0b3JhZ2UgaW50ZXJmYWNlIChzYW1lIGZvciBzdG9yYWdlLmpzLCBsb2NhbC1zdG9yYWdlLmpzLCB1cC1zdG9yYWdlLmpzKS5cbiAqL1xuY2xhc3MgTG9jYWxTdG9yYWdlIHtcbiAgcHVibGljIGNvbmZpZzogQ29uZmlnO1xuICBwdWJsaWMgc3RvcmFnZVBsdWdpbjogU3RvcmFnZVBsdWdpbjtcbiAgcHVibGljIGxvZ2dlcjogTG9nZ2VyO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihjb25maWc6IENvbmZpZywgbG9nZ2VyOiBMb2dnZXIsIGxvY2FsU3RvcmFnZTogU3RvcmFnZVBsdWdpbikge1xuICAgIHRoaXMubG9nZ2VyID0gbG9nZ2VyO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuc3RvcmFnZVBsdWdpbiA9IGxvY2FsU3RvcmFnZTtcbiAgfVxuXG4gIHB1YmxpYyBhZGRQYWNrYWdlKG5hbWU6IHN0cmluZywgcGtnOiBNYW5pZmVzdCwgY2FsbGJhY2s6IENhbGxiYWNrKTogdm9pZCB7XG4gICAgY29uc3Qgc3RvcmFnZTogYW55ID0gdGhpcy5fZ2V0TG9jYWxTdG9yYWdlKG5hbWUpO1xuXG4gICAgaWYgKF8uaXNOaWwoc3RvcmFnZSkpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhFcnJvckNvZGUuZ2V0Tm90Rm91bmQoJ3RoaXMgcGFja2FnZSBjYW5ub3QgYmUgYWRkZWQnKSk7XG4gICAgfVxuXG4gICAgc3RvcmFnZS5jcmVhdGVQYWNrYWdlKG5hbWUsIGdlbmVyYXRlUGFja2FnZVRlbXBsYXRlKG5hbWUpLCAoZXJyKSA9PiB7XG4gICAgICAvLyBGSVhNRTogaXQgd2lsbCBiZSBmaXhlZCBoZXJlIGh0dHBzOi8vZ2l0aHViLmNvbS92ZXJkYWNjaW8vdmVyZGFjY2lvL3B1bGwvMTM2MFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgaWYgKFxuICAgICAgICBfLmlzTnVsbChlcnIpID09PSBmYWxzZSAmJlxuICAgICAgICAoZXJyLmNvZGUgPT09IFNUT1JBR0UuRklMRV9FWElTVF9FUlJPUiB8fCBlcnIuY29kZSA9PT0gSFRUUF9TVEFUVVMuQ09ORkxJQ1QpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKEVycm9yQ29kZS5nZXRDb25mbGljdCgpKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGF0ZXN0ID0gZ2V0TGF0ZXN0VmVyc2lvbihwa2cpO1xuICAgICAgaWYgKF8uaXNOaWwobGF0ZXN0KSA9PT0gZmFsc2UgJiYgcGtnLnZlcnNpb25zW2xhdGVzdF0pIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHBrZy52ZXJzaW9uc1tsYXRlc3RdKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHBhY2thZ2UuXG4gICAqIEBwYXJhbSB7Kn0gbmFtZVxuICAgKiBAcGFyYW0geyp9IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKi9cbiAgcHVibGljIHJlbW92ZVBhY2thZ2UobmFtZTogc3RyaW5nLCBjYWxsYmFjazogQ2FsbGJhY2spOiB2b2lkIHtcbiAgICBjb25zdCBzdG9yYWdlOiBhbnkgPSB0aGlzLl9nZXRMb2NhbFN0b3JhZ2UobmFtZSk7XG4gICAgZGVidWcoJ1tzdG9yYWdlXSByZW1vdmluZyBwYWNrYWdlICVvJywgbmFtZSk7XG4gICAgaWYgKF8uaXNOaWwoc3RvcmFnZSkpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhFcnJvckNvZGUuZ2V0Tm90Rm91bmQoKSk7XG4gICAgfVxuXG4gICAgc3RvcmFnZS5yZWFkUGFja2FnZShuYW1lLCAoZXJyLCBkYXRhOiBNYW5pZmVzdCk6IHZvaWQgPT4ge1xuICAgICAgaWYgKF8uaXNOaWwoZXJyKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgaWYgKGVyci5jb2RlID09PSBTVE9SQUdFLk5PX1NVQ0hfRklMRV9FUlJPUiB8fCBlcnIuY29kZSA9PT0gSFRUUF9TVEFUVVMuTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKEVycm9yQ29kZS5nZXROb3RGb3VuZCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cblxuICAgICAgZGF0YSA9IG5vcm1hbGl6ZVBhY2thZ2UoZGF0YSk7XG4gICAgICB0aGlzLnN0b3JhZ2VQbHVnaW4ucmVtb3ZlKG5hbWUsIChyZW1vdmVGYWlsZWQ6IEVycm9yKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChyZW1vdmVGYWlsZWQpIHtcbiAgICAgICAgICAvLyBUaGlzIHdpbGwgaGFwcGVuIHdoZW4gZGF0YWJhc2UgaXMgbG9ja2VkXG4gICAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXG4gICAgICAgICAgICB7IG5hbWUgfSxcbiAgICAgICAgICAgIGBbc3RvcmFnZS9yZW1vdmVQYWNrYWdlXSB0aGUgZGF0YWJhc2UgaXMgbG9ja2VkLCByZW1vdmVkIGhhcyBmYWlsZWQgZm9yIEB7bmFtZX1gXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soRXJyb3JDb2RlLmdldEJhZERhdGEocmVtb3ZlRmFpbGVkLm1lc3NhZ2UpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0b3JhZ2UuZGVsZXRlUGFja2FnZShTVE9SQUdFLlBBQ0tBR0VfRklMRV9OQU1FLCAoZXJyKTogdm9pZCA9PiB7XG4gICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGF0dGFjaG1lbnRzID0gT2JqZWN0LmtleXMoZGF0YS5fYXR0YWNobWVudHMpO1xuXG4gICAgICAgICAgdGhpcy5fZGVsZXRlQXR0YWNobWVudHMoc3RvcmFnZSwgYXR0YWNobWVudHMsIGNhbGxiYWNrKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTeW5jaHJvbml6ZSByZW1vdGUgcGFja2FnZSBpbmZvIHdpdGggdGhlIGxvY2FsIG9uZVxuICAgKiBAcGFyYW0geyp9IG5hbWVcbiAgICogQHBhcmFtIHsqfSBwYWNrYWdlSW5mb1xuICAgKiBAcGFyYW0geyp9IGNhbGxiYWNrXG4gICAqL1xuICBwdWJsaWMgdXBkYXRlVmVyc2lvbnMobmFtZTogc3RyaW5nLCBwYWNrYWdlSW5mbzogTWFuaWZlc3QsIGNhbGxiYWNrOiBDYWxsYmFjayk6IHZvaWQge1xuICAgIHRoaXMuX3JlYWRDcmVhdGVQYWNrYWdlKG5hbWUsIChlcnIsIHBhY2thZ2VMb2NhbEpzb24pOiB2b2lkID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICB9XG5cbiAgICAgIGxldCBjaGFuZ2UgPSBmYWxzZTtcbiAgICAgIC8vIHVwZGF0aW5nIHJlYWRtZVxuICAgICAgcGFja2FnZUxvY2FsSnNvbi5yZWFkbWUgPSBnZXRMYXRlc3RSZWFkbWUocGFja2FnZUluZm8pO1xuICAgICAgaWYgKHBhY2thZ2VJbmZvLnJlYWRtZSAhPT0gcGFja2FnZUxvY2FsSnNvbi5yZWFkbWUpIHtcbiAgICAgICAgY2hhbmdlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgdmVyc2lvbklkIGluIHBhY2thZ2VJbmZvLnZlcnNpb25zKSB7XG4gICAgICAgIGlmIChfLmlzTmlsKHBhY2thZ2VMb2NhbEpzb24udmVyc2lvbnNbdmVyc2lvbklkXSkpIHtcbiAgICAgICAgICBsZXQgdmVyc2lvbiA9IHBhY2thZ2VJbmZvLnZlcnNpb25zW3ZlcnNpb25JZF07XG5cbiAgICAgICAgICAvLyB3ZSBkb24ndCBrZWVwIHJlYWRtZSBmb3IgcGFja2FnZSB2ZXJzaW9ucyxcbiAgICAgICAgICAvLyBvbmx5IG9uZSByZWFkbWUgcGVyIHBhY2thZ2VcbiAgICAgICAgICB2ZXJzaW9uID0gY2xlYW5VcFJlYWRtZSh2ZXJzaW9uKTtcbiAgICAgICAgICB2ZXJzaW9uLmNvbnRyaWJ1dG9ycyA9IG5vcm1hbGl6ZUNvbnRyaWJ1dG9ycyh2ZXJzaW9uLmNvbnRyaWJ1dG9ycyBhcyBBdXRob3JbXSk7XG5cbiAgICAgICAgICBjaGFuZ2UgPSB0cnVlO1xuICAgICAgICAgIHBhY2thZ2VMb2NhbEpzb24udmVyc2lvbnNbdmVyc2lvbklkXSA9IHZlcnNpb247XG5cbiAgICAgICAgICBpZiAodmVyc2lvbi5kaXN0ICYmIHZlcnNpb24uZGlzdC50YXJiYWxsKSB7XG4gICAgICAgICAgICBjb25zdCB1cmxPYmplY3Q6IGFueSA9IFVybE5vZGUucGFyc2UodmVyc2lvbi5kaXN0LnRhcmJhbGwpO1xuICAgICAgICAgICAgY29uc3QgZmlsZW5hbWUgPSB1cmxPYmplY3QucGF0aG5hbWUucmVwbGFjZSgvXi4qXFwvLywgJycpO1xuXG4gICAgICAgICAgICAvLyB3ZSBkbyBOT1Qgb3ZlcndyaXRlIGFueSBleGlzdGluZyByZWNvcmRzXG4gICAgICAgICAgICBpZiAoXy5pc05pbChwYWNrYWdlTG9jYWxKc29uLl9kaXN0ZmlsZXNbZmlsZW5hbWVdKSkge1xuICAgICAgICAgICAgICBjb25zdCBoYXNoOiBEaXN0RmlsZSA9IChwYWNrYWdlTG9jYWxKc29uLl9kaXN0ZmlsZXNbZmlsZW5hbWVdID0ge1xuICAgICAgICAgICAgICAgIHVybDogdmVyc2lvbi5kaXN0LnRhcmJhbGwsXG4gICAgICAgICAgICAgICAgc2hhOiB2ZXJzaW9uLmRpc3Quc2hhc3VtLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgLyogZXNsaW50IHNwYWNlZC1jb21tZW50OiAwICovXG4gICAgICAgICAgICAgIGNvbnN0IHVwTGluazogc3RyaW5nID0gdmVyc2lvbltTeW1ib2wuZm9yKCdfX3ZlcmRhY2Npb191cGxpbmsnKV07XG5cbiAgICAgICAgICAgICAgaWYgKF8uaXNOaWwodXBMaW5rKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVVcGxpbmtUb1JlbW90ZVByb3RvY29sKGhhc2gsIHVwTGluayk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCB0YWcgaW4gcGFja2FnZUluZm9bRElTVF9UQUdTXSkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgIXBhY2thZ2VMb2NhbEpzb25bRElTVF9UQUdTXVt0YWddIHx8XG4gICAgICAgICAgcGFja2FnZUxvY2FsSnNvbltESVNUX1RBR1NdW3RhZ10gIT09IHBhY2thZ2VJbmZvW0RJU1RfVEFHU11bdGFnXVxuICAgICAgICApIHtcbiAgICAgICAgICBjaGFuZ2UgPSB0cnVlO1xuICAgICAgICAgIHBhY2thZ2VMb2NhbEpzb25bRElTVF9UQUdTXVt0YWddID0gcGFja2FnZUluZm9bRElTVF9UQUdTXVt0YWddO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgdXAgaW4gcGFja2FnZUluZm8uX3VwbGlua3MpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwYWNrYWdlSW5mby5fdXBsaW5rcywgdXApKSB7XG4gICAgICAgICAgY29uc3QgbmVlZF9jaGFuZ2UgPVxuICAgICAgICAgICAgIWlzT2JqZWN0KHBhY2thZ2VMb2NhbEpzb24uX3VwbGlua3NbdXBdKSB8fFxuICAgICAgICAgICAgcGFja2FnZUluZm8uX3VwbGlua3NbdXBdLmV0YWcgIT09IHBhY2thZ2VMb2NhbEpzb24uX3VwbGlua3NbdXBdLmV0YWcgfHxcbiAgICAgICAgICAgIHBhY2thZ2VJbmZvLl91cGxpbmtzW3VwXS5mZXRjaGVkICE9PSBwYWNrYWdlTG9jYWxKc29uLl91cGxpbmtzW3VwXS5mZXRjaGVkO1xuXG4gICAgICAgICAgaWYgKG5lZWRfY2hhbmdlKSB7XG4gICAgICAgICAgICBjaGFuZ2UgPSB0cnVlO1xuICAgICAgICAgICAgcGFja2FnZUxvY2FsSnNvbi5fdXBsaW5rc1t1cF0gPSBwYWNrYWdlSW5mby5fdXBsaW5rc1t1cF07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgndGltZScgaW4gcGFja2FnZUluZm8gJiYgIV8uaXNFcXVhbChwYWNrYWdlTG9jYWxKc29uLnRpbWUsIHBhY2thZ2VJbmZvLnRpbWUpKSB7XG4gICAgICAgIHBhY2thZ2VMb2NhbEpzb24udGltZSA9IHBhY2thZ2VJbmZvLnRpbWU7XG4gICAgICAgIGNoYW5nZSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2UpIHtcbiAgICAgICAgZGVidWcoJ3VwZGF0aW5nIHBhY2thZ2UgJW8gaW5mbycsIG5hbWUpO1xuICAgICAgICB0aGlzLl93cml0ZVBhY2thZ2UobmFtZSwgcGFja2FnZUxvY2FsSnNvbiwgZnVuY3Rpb24gKGVycik6IHZvaWQge1xuICAgICAgICAgIGNhbGxiYWNrKGVyciwgcGFja2FnZUxvY2FsSnNvbik7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcGFja2FnZUxvY2FsSnNvbik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgbmV3IHZlcnNpb24gdG8gYSBwcmV2aW91cyBsb2NhbCBwYWNrYWdlLlxuICAgKiBAcGFyYW0geyp9IG5hbWVcbiAgICogQHBhcmFtIHsqfSB2ZXJzaW9uXG4gICAqIEBwYXJhbSB7Kn0gbWV0YWRhdGFcbiAgICogQHBhcmFtIHsqfSB0YWdcbiAgICogQHBhcmFtIHsqfSBjYWxsYmFja1xuICAgKi9cbiAgcHVibGljIGFkZFZlcnNpb24oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHZlcnNpb246IHN0cmluZyxcbiAgICBtZXRhZGF0YTogVmVyc2lvbixcbiAgICB0YWc6IFN0cmluZ1ZhbHVlLFxuICAgIGNhbGxiYWNrOiBDYWxsYmFja1xuICApOiB2b2lkIHtcbiAgICB0aGlzLl91cGRhdGVQYWNrYWdlKFxuICAgICAgbmFtZSxcbiAgICAgIChkYXRhLCBjYjogQ2FsbGJhY2spOiB2b2lkID0+IHtcbiAgICAgICAgLy8ga2VlcCBvbmx5IG9uZSByZWFkbWUgcGVyIHBhY2thZ2VcbiAgICAgICAgZGF0YS5yZWFkbWUgPSBtZXRhZGF0YS5yZWFkbWU7XG5cbiAgICAgICAgLy8gVE9ETzogbG9kYXNoIHJlbW92ZVxuICAgICAgICBtZXRhZGF0YSA9IGNsZWFuVXBSZWFkbWUobWV0YWRhdGEpO1xuICAgICAgICBtZXRhZGF0YS5jb250cmlidXRvcnMgPSBub3JtYWxpemVDb250cmlidXRvcnMobWV0YWRhdGEuY29udHJpYnV0b3JzIGFzIEF1dGhvcltdKTtcblxuICAgICAgICBjb25zdCBoYXNWZXJzaW9uID0gZGF0YS52ZXJzaW9uc1t2ZXJzaW9uXSAhPSBudWxsO1xuICAgICAgICBpZiAoaGFzVmVyc2lvbikge1xuICAgICAgICAgIHJldHVybiBjYihFcnJvckNvZGUuZ2V0Q29uZmxpY3QoKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB1cGxvYWRlZCB0YXJiYWxsIGhhcyBhIGRpZmZlcmVudCBzaGFzdW0sIGl0J3MgdmVyeSBsaWtlbHkgdGhhdCB3ZSBoYXZlIHNvbWUga2luZCBvZiBlcnJvclxuICAgICAgICBpZiAoaXNPYmplY3QobWV0YWRhdGEuZGlzdCkgJiYgXy5pc1N0cmluZyhtZXRhZGF0YS5kaXN0LnRhcmJhbGwpKSB7XG4gICAgICAgICAgY29uc3QgdGFyYmFsbCA9IG1ldGFkYXRhLmRpc3QudGFyYmFsbC5yZXBsYWNlKC8uKlxcLy8sICcnKTtcblxuICAgICAgICAgIGlmIChpc09iamVjdChkYXRhLl9hdHRhY2htZW50c1t0YXJiYWxsXSkpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgXy5pc05pbChkYXRhLl9hdHRhY2htZW50c1t0YXJiYWxsXS5zaGFzdW0pID09PSBmYWxzZSAmJlxuICAgICAgICAgICAgICBfLmlzTmlsKG1ldGFkYXRhLmRpc3Quc2hhc3VtKSA9PT0gZmFsc2VcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBpZiAoZGF0YS5fYXR0YWNobWVudHNbdGFyYmFsbF0uc2hhc3VtICE9IG1ldGFkYXRhLmRpc3Quc2hhc3VtKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gYHNoYXN1bSBlcnJvciwgJHtkYXRhLl9hdHRhY2htZW50c1t0YXJiYWxsXS5zaGFzdW19ICE9ICR7bWV0YWRhdGEuZGlzdC5zaGFzdW19YDtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2IoRXJyb3JDb2RlLmdldEJhZFJlcXVlc3QoZXJyb3JNZXNzYWdlKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIC8vIHNvbWUgb2xkIHN0b3JhZ2UgZG8gbm90IGhhdmUgdGhpcyBmaWVsZCAjNzQwXG4gICAgICAgICAgICBpZiAoXy5pc05pbChkYXRhLnRpbWUpKSB7XG4gICAgICAgICAgICAgIGRhdGEudGltZSA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRhLnRpbWVbJ21vZGlmaWVkJ10gPSBjdXJyZW50RGF0ZTtcblxuICAgICAgICAgICAgaWYgKCdjcmVhdGVkJyBpbiBkYXRhLnRpbWUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgIGRhdGEudGltZS5jcmVhdGVkID0gY3VycmVudERhdGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRhdGEudGltZVt2ZXJzaW9uXSA9IGN1cnJlbnREYXRlO1xuICAgICAgICAgICAgZGF0YS5fYXR0YWNobWVudHNbdGFyYmFsbF0udmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZGF0YS52ZXJzaW9uc1t2ZXJzaW9uXSA9IG1ldGFkYXRhO1xuICAgICAgICB0YWdWZXJzaW9uKGRhdGEsIHZlcnNpb24sIHRhZyk7XG5cbiAgICAgICAgdGhpcy5zdG9yYWdlUGx1Z2luLmFkZChuYW1lLCAoYWRkRmFpbGVkKTogdm9pZCA9PiB7XG4gICAgICAgICAgaWYgKGFkZEZhaWxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIGNiKEVycm9yQ29kZS5nZXRCYWREYXRhKGFkZEZhaWxlZC5tZXNzYWdlKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgY2FsbGJhY2tcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIE1lcmdlIGEgbmV3IGxpc3Qgb2YgdGFncyBmb3IgYSBsb2NhbCBwYWNrYWdlcyB3aXRoIHRoZSBleGlzdGluZyBvbmUuXG4gICAqIEBwYXJhbSB7Kn0gcGtnTmFtZVxuICAgKiBAcGFyYW0geyp9IHRhZ3NcbiAgICogQHBhcmFtIHsqfSBjYWxsYmFja1xuICAgKi9cbiAgcHVibGljIG1lcmdlVGFncyhwa2dOYW1lOiBzdHJpbmcsIHRhZ3M6IE1lcmdlVGFncywgY2FsbGJhY2s6IENhbGxiYWNrKTogdm9pZCB7XG4gICAgdGhpcy5fdXBkYXRlUGFja2FnZShcbiAgICAgIHBrZ05hbWUsXG4gICAgICAoZGF0YSwgY2IpOiB2b2lkID0+IHtcbiAgICAgICAgLyogZXNsaW50IGd1YXJkLWZvci1pbjogMCAqL1xuICAgICAgICBmb3IgKGNvbnN0IHRhZyBpbiB0YWdzKSB7XG4gICAgICAgICAgLy8gdGhpcyBoYW5kbGUgZGlzdC10YWcgcm0gY29tbWFuZFxuICAgICAgICAgIGlmIChfLmlzTnVsbCh0YWdzW3RhZ10pKSB7XG4gICAgICAgICAgICBkZWxldGUgZGF0YVtESVNUX1RBR1NdW3RhZ107XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoXy5pc05pbChkYXRhLnZlcnNpb25zW3RhZ3NbdGFnXV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gY2IodGhpcy5fZ2V0VmVyc2lvbk5vdEZvdW5kKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCB2ZXJzaW9uOiBzdHJpbmcgPSB0YWdzW3RhZ107XG4gICAgICAgICAgdGFnVmVyc2lvbihkYXRhLCB2ZXJzaW9uLCB0YWcpO1xuICAgICAgICB9XG4gICAgICAgIGNiKG51bGwpO1xuICAgICAgfSxcbiAgICAgIGNhbGxiYWNrXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdmVyc2lvbiBub3QgZm91bmRcbiAgICogQHJldHVybiB7U3RyaW5nfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0VmVyc2lvbk5vdEZvdW5kKCk6IGFueSB7XG4gICAgcmV0dXJuIEVycm9yQ29kZS5nZXROb3RGb3VuZChBUElfRVJST1IuVkVSU0lPTl9OT1RfRVhJU1QpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBmaWxlIG5vIGF2YWlsYWJsZVxuICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9nZXRGaWxlTm90QXZhaWxhYmxlKCk6IGFueSB7XG4gICAgcmV0dXJuIEVycm9yQ29kZS5nZXROb3RGb3VuZCgnbm8gc3VjaCBmaWxlIGF2YWlsYWJsZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcGFja2FnZSBtZXRhZGF0YSwgdGFncyBhbmQgYXR0YWNobWVudHMgKHRhcmJhbGxzKS5cbiAgICogTm90ZTogQ3VycmVudGx5IHN1cHBvcnRzIHVucHVibGlzaGluZyBhbmQgZGVwcmVjYXRpb24uXG4gICAqIEBwYXJhbSB7Kn0gbmFtZVxuICAgKiBAcGFyYW0geyp9IGluY29taW5nUGtnXG4gICAqIEBwYXJhbSB7Kn0gcmV2aXNpb25cbiAgICogQHBhcmFtIHsqfSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICovXG4gIHB1YmxpYyBjaGFuZ2VQYWNrYWdlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBpbmNvbWluZ1BrZzogTWFuaWZlc3QsXG4gICAgcmV2aXNpb246IHN0cmluZyB8IHZvaWQsXG4gICAgY2FsbGJhY2s6IENhbGxiYWNrXG4gICk6IHZvaWQge1xuICAgIGlmICghaXNPYmplY3QoaW5jb21pbmdQa2cudmVyc2lvbnMpIHx8ICFpc09iamVjdChpbmNvbWluZ1BrZ1tESVNUX1RBR1NdKSkge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoeyBuYW1lIH0sIGBjaGFuZ2VQYWNrYWdlIGJhZCBkYXRhIGZvciBAe25hbWV9YCk7XG4gICAgICByZXR1cm4gY2FsbGJhY2soRXJyb3JDb2RlLmdldEJhZERhdGEoKSk7XG4gICAgfVxuICAgIGRlYnVnKCdjaGFuZ2VQYWNrYWdlIHVkYXB0aW5nIHBhY2thZ2UgZm9yICVvJywgbmFtZSk7XG4gICAgdGhpcy5fdXBkYXRlUGFja2FnZShcbiAgICAgIG5hbWUsXG4gICAgICAobG9jYWxEYXRhOiBNYW5pZmVzdCwgY2I6IENhbGxiYWNrKTogdm9pZCA9PiB7XG4gICAgICAgIGZvciAoY29uc3QgdmVyc2lvbiBpbiBsb2NhbERhdGEudmVyc2lvbnMpIHtcbiAgICAgICAgICBjb25zdCBpbmNvbWluZ1ZlcnNpb24gPSBpbmNvbWluZ1BrZy52ZXJzaW9uc1t2ZXJzaW9uXTtcbiAgICAgICAgICBpZiAoXy5pc05pbChpbmNvbWluZ1ZlcnNpb24pKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKHsgbmFtZTogbmFtZSwgdmVyc2lvbjogdmVyc2lvbiB9LCAndW5wdWJsaXNoaW5nIEB7bmFtZX1AQHt2ZXJzaW9ufScpO1xuXG4gICAgICAgICAgICAvLyBGSVhNRTogSSBwcmVmZXIgcmV0dXJuIGEgbmV3IG9iamVjdCByYXRoZXIgbXV0YXRlIHRoZSBtZXRhZGF0YVxuICAgICAgICAgICAgZGVsZXRlIGxvY2FsRGF0YS52ZXJzaW9uc1t2ZXJzaW9uXTtcbiAgICAgICAgICAgIGRlbGV0ZSBsb2NhbERhdGEudGltZSFbdmVyc2lvbl07XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBpbiBsb2NhbERhdGEuX2F0dGFjaG1lbnRzKSB7XG4gICAgICAgICAgICAgIGlmIChsb2NhbERhdGEuX2F0dGFjaG1lbnRzW2ZpbGVdLnZlcnNpb24gPT09IHZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgbG9jYWxEYXRhLl9hdHRhY2htZW50c1tmaWxlXS52ZXJzaW9uO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoaW5jb21pbmdWZXJzaW9uLCAnZGVwcmVjYXRlZCcpKSB7XG4gICAgICAgICAgICBjb25zdCBpbmNvbWluZ0RlcHJlY2F0ZWQgPSBpbmNvbWluZ1ZlcnNpb24uZGVwcmVjYXRlZDtcbiAgICAgICAgICAgIGlmIChpbmNvbWluZ0RlcHJlY2F0ZWQgIT0gbG9jYWxEYXRhLnZlcnNpb25zW3ZlcnNpb25dLmRlcHJlY2F0ZWQpIHtcbiAgICAgICAgICAgICAgaWYgKCFpbmNvbWluZ0RlcHJlY2F0ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZ2dlci5pbmZvKFxuICAgICAgICAgICAgICAgICAgeyBuYW1lOiBuYW1lLCB2ZXJzaW9uOiB2ZXJzaW9uIH0sXG4gICAgICAgICAgICAgICAgICAndW5kZXByZWNhdGluZyBAe25hbWV9QEB7dmVyc2lvbn0nXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgbG9jYWxEYXRhLnZlcnNpb25zW3ZlcnNpb25dLmRlcHJlY2F0ZWQ7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2dnZXIuaW5mbyhcbiAgICAgICAgICAgICAgICAgIHsgbmFtZTogbmFtZSwgdmVyc2lvbjogdmVyc2lvbiB9LFxuICAgICAgICAgICAgICAgICAgJ2RlcHJlY2F0aW5nIEB7bmFtZX1AQHt2ZXJzaW9ufSdcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGxvY2FsRGF0YS52ZXJzaW9uc1t2ZXJzaW9uXS5kZXByZWNhdGVkID0gaW5jb21pbmdEZXByZWNhdGVkO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGxvY2FsRGF0YS50aW1lIS5tb2RpZmllZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbERhdGFbVVNFUlNdID0gaW5jb21pbmdQa2dbVVNFUlNdO1xuICAgICAgICBsb2NhbERhdGFbRElTVF9UQUdTXSA9IGluY29taW5nUGtnW0RJU1RfVEFHU107XG4gICAgICAgIGNiKG51bGwpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uIChlcnIpOiB2b2lkIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuICAvKipcbiAgICogUmVtb3ZlIGEgdGFyYmFsbC5cbiAgICogQHBhcmFtIHsqfSBuYW1lXG4gICAqIEBwYXJhbSB7Kn0gZmlsZW5hbWVcbiAgICogQHBhcmFtIHsqfSByZXZpc2lvblxuICAgKiBAcGFyYW0geyp9IGNhbGxiYWNrXG4gICAqL1xuICBwdWJsaWMgcmVtb3ZlVGFyYmFsbChuYW1lOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcsIHJldmlzaW9uOiBzdHJpbmcsIGNhbGxiYWNrOiBDYWxsYmFjayk6IHZvaWQge1xuICAgIGFzc2VydCh2YWxpZGF0ZU5hbWUoZmlsZW5hbWUpKTtcblxuICAgIHRoaXMuX3VwZGF0ZVBhY2thZ2UoXG4gICAgICBuYW1lLFxuICAgICAgKGRhdGEsIGNiKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChkYXRhLl9hdHRhY2htZW50c1tmaWxlbmFtZV0pIHtcbiAgICAgICAgICBkZWxldGUgZGF0YS5fYXR0YWNobWVudHNbZmlsZW5hbWVdO1xuICAgICAgICAgIGNiKG51bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNiKHRoaXMuX2dldEZpbGVOb3RBdmFpbGFibGUoKSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAoZXJyOiBhbnkpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0b3JhZ2UgPSB0aGlzLl9nZXRMb2NhbFN0b3JhZ2UobmFtZSk7XG5cbiAgICAgICAgaWYgKHN0b3JhZ2UpIHtcbiAgICAgICAgICBzdG9yYWdlLmRlbGV0ZVBhY2thZ2UoZmlsZW5hbWUsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgdGFyYmFsbC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGZpbGVuYW1lXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHB1YmxpYyBhZGRUYXJiYWxsKG5hbWU6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZykge1xuICAgIGFzc2VydCh2YWxpZGF0ZU5hbWUoZmlsZW5hbWUpKTtcblxuICAgIGxldCBsZW5ndGggPSAwO1xuICAgIGNvbnN0IHNoYU9uZUhhc2ggPSBjcmVhdGVUYXJiYWxsSGFzaCgpO1xuICAgIGNvbnN0IHVwbG9hZFN0cmVhbSA9IG5ldyBVcGxvYWRUYXJiYWxsKHt9KTtcbiAgICBjb25zdCBfdHJhbnNmb3JtID0gdXBsb2FkU3RyZWFtLl90cmFuc2Zvcm07XG4gICAgY29uc3Qgc3RvcmFnZSA9IHRoaXMuX2dldExvY2FsU3RvcmFnZShuYW1lKTtcblxuICAgIHVwbG9hZFN0cmVhbS5hYm9ydCA9IGZ1bmN0aW9uICgpOiB2b2lkIHt9O1xuICAgIHVwbG9hZFN0cmVhbS5kb25lID0gZnVuY3Rpb24gKCk6IHZvaWQge307XG5cbiAgICB1cGxvYWRTdHJlYW0uX3RyYW5zZm9ybSA9IGZ1bmN0aW9uIChkYXRhLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICBzaGFPbmVIYXNoLnVwZGF0ZShkYXRhKTtcbiAgICAgIC8vIG1lYXN1cmUgdGhlIGxlbmd0aCBmb3IgdmFsaWRhdGlvbiByZWFzb25zXG4gICAgICBsZW5ndGggKz0gZGF0YS5sZW5ndGg7XG4gICAgICBjb25zdCBhcHBsaWVkRGF0YSA9IFtkYXRhLCAuLi5hcmdzXTtcbiAgICAgIC8vIEZJWE1FOiBub3Qgc3VyZSBhYm91dCB0aGlzIGFwcHJvYWNoLCB0c2MgY29tcGxhaW5zXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBfdHJhbnNmb3JtLmFwcGx5KHVwbG9hZFN0cmVhbSwgYXBwbGllZERhdGEpO1xuICAgIH07XG5cbiAgICBpZiAobmFtZSA9PT0gJ19fcHJvdG9fXycpIHtcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soKCk6IHZvaWQgPT4ge1xuICAgICAgICB1cGxvYWRTdHJlYW0uZW1pdCgnZXJyb3InLCBFcnJvckNvZGUuZ2V0Rm9yYmlkZGVuKCkpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdXBsb2FkU3RyZWFtO1xuICAgIH1cblxuICAgIGlmICghc3RvcmFnZSkge1xuICAgICAgcHJvY2Vzcy5uZXh0VGljaygoKTogdm9pZCA9PiB7XG4gICAgICAgIHVwbG9hZFN0cmVhbS5lbWl0KCdlcnJvcicsIFwiY2FuJ3QgdXBsb2FkIHRoaXMgcGFja2FnZVwiKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHVwbG9hZFN0cmVhbTtcbiAgICB9XG5cbiAgICBjb25zdCB3cml0ZVN0cmVhbSA9IHN0b3JhZ2Uud3JpdGVUYXJiYWxsKGZpbGVuYW1lKTtcblxuICAgIHdyaXRlU3RyZWFtLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIuY29kZSA9PT0gU1RPUkFHRS5GSUxFX0VYSVNUX0VSUk9SIHx8IGVyci5jb2RlID09PSBIVFRQX1NUQVRVUy5DT05GTElDVCkge1xuICAgICAgICB1cGxvYWRTdHJlYW0uZW1pdCgnZXJyb3InLCBFcnJvckNvZGUuZ2V0Q29uZmxpY3QoKSk7XG4gICAgICAgIHVwbG9hZFN0cmVhbS5hYm9ydCgpO1xuICAgICAgfSBlbHNlIGlmIChlcnIuY29kZSA9PT0gU1RPUkFHRS5OT19TVUNIX0ZJTEVfRVJST1IgfHwgZXJyLmNvZGUgPT09IEhUVFBfU1RBVFVTLk5PVF9GT1VORCkge1xuICAgICAgICAvLyBjaGVjayBpZiBwYWNrYWdlIGV4aXN0cyB0byB0aHJvdyBhbiBhcHByb3ByaWF0ZSBtZXNzYWdlXG4gICAgICAgIHRoaXMuZ2V0UGFja2FnZU1ldGFkYXRhKG5hbWUsIGZ1bmN0aW9uIChfZXJyOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgICBpZiAoX2Vycikge1xuICAgICAgICAgICAgdXBsb2FkU3RyZWFtLmVtaXQoJ2Vycm9yJywgX2Vycik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwbG9hZFN0cmVhbS5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVwbG9hZFN0cmVhbS5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB3cml0ZVN0cmVhbS5vbignb3BlbicsIGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAgICAgIC8vIHJlLWVtaXR0aW5nIG9wZW4gYmVjYXVzZSBpdCdzIGhhbmRsZWQgaW4gc3RvcmFnZS5qc1xuICAgICAgdXBsb2FkU3RyZWFtLmVtaXQoJ29wZW4nKTtcbiAgICB9KTtcblxuICAgIHdyaXRlU3RyZWFtLm9uKCdzdWNjZXNzJywgKCk6IHZvaWQgPT4ge1xuICAgICAgdGhpcy5fdXBkYXRlUGFja2FnZShcbiAgICAgICAgbmFtZSxcbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlcihkYXRhLCBjYik6IHZvaWQge1xuICAgICAgICAgIGRhdGEuX2F0dGFjaG1lbnRzW2ZpbGVuYW1lXSA9IHtcbiAgICAgICAgICAgIHNoYXN1bTogc2hhT25lSGFzaC5kaWdlc3QoJ2hleCcpLFxuICAgICAgICAgIH07XG4gICAgICAgICAgY2IobnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlcnIpOiB2b2lkIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB1cGxvYWRTdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cGxvYWRTdHJlYW0uZW1pdCgnc3VjY2VzcycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIHVwbG9hZFN0cmVhbS5hYm9ydCA9IGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAgICAgIHdyaXRlU3RyZWFtLmFib3J0KCk7XG4gICAgfTtcblxuICAgIHVwbG9hZFN0cmVhbS5kb25lID0gZnVuY3Rpb24gKCk6IHZvaWQge1xuICAgICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgdXBsb2FkU3RyZWFtLmVtaXQoJ2Vycm9yJywgRXJyb3JDb2RlLmdldEJhZERhdGEoJ3JlZnVzaW5nIHRvIGFjY2VwdCB6ZXJvLWxlbmd0aCBmaWxlJykpO1xuICAgICAgICB3cml0ZVN0cmVhbS5hYm9ydCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd3JpdGVTdHJlYW0uZG9uZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB1cGxvYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XG5cbiAgICByZXR1cm4gdXBsb2FkU3RyZWFtO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHRhcmJhbGwuXG4gICAqIEBwYXJhbSB7Kn0gbmFtZVxuICAgKiBAcGFyYW0geyp9IGZpbGVuYW1lXG4gICAqIEByZXR1cm4ge1JlYWRUYXJiYWxsfVxuICAgKi9cbiAgcHVibGljIGdldFRhcmJhbGwobmFtZTogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nKSB7XG4gICAgYXNzZXJ0KHZhbGlkYXRlTmFtZShmaWxlbmFtZSkpO1xuXG4gICAgY29uc3Qgc3RvcmFnZSA9IHRoaXMuX2dldExvY2FsU3RvcmFnZShuYW1lKTtcblxuICAgIGlmIChfLmlzTmlsKHN0b3JhZ2UpKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY3JlYXRlRmFpbHVyZVN0cmVhbVJlc3BvbnNlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3N0cmVhbVN1Y2Nlc3NSZWFkVGFyQmFsbChzdG9yYWdlLCBmaWxlbmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGEgc3RyZWFtIHRoYXQgZW1pdHMgYSByZWFkIGZhaWx1cmUuXG4gICAqIEBwcml2YXRlXG4gICAqIEByZXR1cm4ge1JlYWRUYXJiYWxsfVxuICAgKi9cbiAgcHJpdmF0ZSBfY3JlYXRlRmFpbHVyZVN0cmVhbVJlc3BvbnNlKCkge1xuICAgIGNvbnN0IHN0cmVhbSA9IG5ldyBSZWFkVGFyYmFsbCh7fSk7XG5cbiAgICBwcm9jZXNzLm5leHRUaWNrKCgpOiB2b2lkID0+IHtcbiAgICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIHRoaXMuX2dldEZpbGVOb3RBdmFpbGFibGUoKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gYSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgdGFyYmFsbCBkYXRhXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdG9yYWdlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlbmFtZVxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcmV0dXJuIHtSZWFkVGFyYmFsbH1cbiAgICovXG4gIHByaXZhdGUgX3N0cmVhbVN1Y2Nlc3NSZWFkVGFyQmFsbChzdG9yYWdlOiBhbnksIGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBzdHJlYW0gPSBuZXcgUmVhZFRhcmJhbGwoe30pO1xuICAgIGNvbnN0IHJlYWRUYXJiYWxsU3RyZWFtID0gc3RvcmFnZS5yZWFkVGFyYmFsbChmaWxlbmFtZSk7XG4gICAgY29uc3QgZTQwNCA9IEVycm9yQ29kZS5nZXROb3RGb3VuZDtcblxuICAgIHN0cmVhbS5hYm9ydCA9IGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAgICAgIGlmIChfLmlzTmlsKHJlYWRUYXJiYWxsU3RyZWFtKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmVhZFRhcmJhbGxTdHJlYW0uYWJvcnQoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmVhZFRhcmJhbGxTdHJlYW0ub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xuICAgICAgaWYgKGVyci5jb2RlID09PSBTVE9SQUdFLk5PX1NVQ0hfRklMRV9FUlJPUiB8fCBlcnIuY29kZSA9PT0gSFRUUF9TVEFUVVMuTk9UX0ZPVU5EKSB7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIGU0MDQoJ25vIHN1Y2ggZmlsZSBhdmFpbGFibGUnKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmVhZFRhcmJhbGxTdHJlYW0ub24oJ2NvbnRlbnQtbGVuZ3RoJywgZnVuY3Rpb24gKGNvbnRlbnQpOiB2b2lkIHtcbiAgICAgIHN0cmVhbS5lbWl0KCdjb250ZW50LWxlbmd0aCcsIGNvbnRlbnQpO1xuICAgIH0pO1xuXG4gICAgcmVhZFRhcmJhbGxTdHJlYW0ub24oJ29wZW4nLCBmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAgICAvLyByZS1lbWl0dGluZyBvcGVuIGJlY2F1c2UgaXQncyBoYW5kbGVkIGluIHN0b3JhZ2UuanNcbiAgICAgIHN0cmVhbS5lbWl0KCdvcGVuJyk7XG4gICAgICByZWFkVGFyYmFsbFN0cmVhbS5waXBlKHN0cmVhbSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3RyZWFtO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIGEgcGFja2FnZSBieSBuYW1lLlxuICAgKiBAcGFyYW0geyp9IG5hbWVcbiAgICogQHBhcmFtIHsqfSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICovXG4gIHB1YmxpYyBnZXRQYWNrYWdlTWV0YWRhdGEobmFtZTogc3RyaW5nLCBjYWxsYmFjazogQ2FsbGJhY2sgPSAoKTogdm9pZCA9PiB7fSk6IHZvaWQge1xuICAgIGNvbnN0IHN0b3JhZ2UgPSB0aGlzLl9nZXRMb2NhbFN0b3JhZ2UobmFtZSk7XG4gICAgaWYgKF8uaXNOaWwoc3RvcmFnZSkpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhFcnJvckNvZGUuZ2V0Tm90Rm91bmQoKSk7XG4gICAgfVxuXG4gICAgdGhpcy5fcmVhZFBhY2thZ2UobmFtZSwgc3RvcmFnZSwgY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaCBhIGxvY2FsIHBhY2thZ2UuXG4gICAqIEBwYXJhbSB7Kn0gc3RhcnRLZXlcbiAgICogQHBhcmFtIHsqfSBvcHRpb25zXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKi9cbiAgcHVibGljIHNlYXJjaChzdGFydEtleTogc3RyaW5nLCBvcHRpb25zOiBhbnkpIHtcbiAgICBkZWJ1Zygnb3B0aW9ucyBmb3Igc2VhcmNoICVvJywgb3B0aW9ucyk7XG4gICAgY29uc3Qgc3RyZWFtID0gbmV3IFJlYWRUYXJiYWxsKHsgb2JqZWN0TW9kZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuX3NlYXJjaEVhY2hQYWNrYWdlKFxuICAgICAgKGl0ZW06IE1hbmlmZXN0LCBjYjogQ2FsbGJhY2spOiB2b2lkID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoaXRlbS50aW1lID4gcGFyc2VJbnQoc3RhcnRLZXksIDEwKSkge1xuICAgICAgICAgIHRoaXMuZ2V0UGFja2FnZU1ldGFkYXRhKGl0ZW0ubmFtZSwgKGVycjogYW55LCBkYXRhOiBNYW5pZmVzdCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICByZXR1cm4gY2IoZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgdGltZSA9IG5ldyBEYXRlKGl0ZW0udGltZSkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHByZXBhcmVTZWFyY2hQYWNrYWdlKGRhdGEsIHRpbWUpO1xuICAgICAgICAgICAgaWYgKF8uaXNOaWwocmVzdWx0KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgc3RyZWFtLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNiKG51bGwpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNiKG51bGwpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24gb25FbmQoZXJyKTogdm9pZCB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBzdHJlYW0uZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdHJlYW0uZW5kKCk7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiBzdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgYSB3cmFwcGVyIHRoYXQgcHJvdmlkZSBhY2Nlc3MgdG8gdGhlIHBhY2thZ2UgbG9jYXRpb24uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwa2dOYW1lIHBhY2thZ2UgbmFtZS5cbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cbiAgcHJpdmF0ZSBfZ2V0TG9jYWxTdG9yYWdlKHBrZ05hbWU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLnN0b3JhZ2VQbHVnaW4uZ2V0UGFja2FnZVN0b3JhZ2UocGtnTmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVhZCBhIGpzb24gZmlsZSBmcm9tIHN0b3JhZ2UuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdG9yYWdlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBwcml2YXRlIF9yZWFkUGFja2FnZShuYW1lOiBzdHJpbmcsIHN0b3JhZ2U6IGFueSwgY2FsbGJhY2s6IENhbGxiYWNrKTogdm9pZCB7XG4gICAgc3RvcmFnZS5yZWFkUGFja2FnZShuYW1lLCAoZXJyLCByZXN1bHQpOiB2b2lkID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgaWYgKGVyci5jb2RlID09PSBTVE9SQUdFLk5PX1NVQ0hfRklMRV9FUlJPUiB8fCBlcnIuY29kZSA9PT0gSFRUUF9TVEFUVVMuTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKEVycm9yQ29kZS5nZXROb3RGb3VuZCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5faW50ZXJuYWxFcnJvcihlcnIsIFNUT1JBR0UuUEFDS0FHRV9GSUxFX05BTUUsICdlcnJvciByZWFkaW5nJykpO1xuICAgICAgfVxuXG4gICAgICBjYWxsYmFjayhlcnIsIG5vcm1hbGl6ZVBhY2thZ2UocmVzdWx0KSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogV2Fsa3MgdGhyb3VnaCBlYWNoIHBhY2thZ2UgYW5kIGNhbGxzIGBvbl9wYWNrYWdlYCBvbiB0aGVtLlxuICAgKiBAcGFyYW0geyp9IG9uUGFja2FnZVxuICAgKiBAcGFyYW0geyp9IG9uRW5kXG4gICAqL1xuICBwcml2YXRlIF9zZWFyY2hFYWNoUGFja2FnZShvblBhY2thZ2U6IG9uU2VhcmNoUGFja2FnZSwgb25FbmQ6IG9uRW5kU2VhcmNoUGFja2FnZSk6IHZvaWQge1xuICAgIC8vIHNhdmUgd2FpdCB3aGV0aGVyIHBsdWdpbiBzdGlsbCBkbyBub3Qgc3VwcG9ydCBzZWFyY2ggZnVuY3Rpb25hbGl0eVxuICAgIGlmIChfLmlzTmlsKHRoaXMuc3RvcmFnZVBsdWdpbi5zZWFyY2gpKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKCdwbHVnaW4gc2VhcmNoIG5vdCBpbXBsZW1lbnRlZCB5ZXQnKTtcbiAgICAgIG9uRW5kKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcmFnZVBsdWdpbi5zZWFyY2gob25QYWNrYWdlLCBvbkVuZCwgdmFsaWRhdGVOYW1lKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgZWl0aGVyIGEgcHJldmlvdXMgY3JlYXRlZCBsb2NhbCBwYWNrYWdlIG9yIGEgYm9pbGVycGxhdGUuXG4gICAqIEBwYXJhbSB7Kn0gcGtnTmFtZVxuICAgKiBAcGFyYW0geyp9IGNhbGxiYWNrXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKi9cbiAgcHJpdmF0ZSBfcmVhZENyZWF0ZVBhY2thZ2UocGtnTmFtZTogc3RyaW5nLCBjYWxsYmFjazogQ2FsbGJhY2spOiB2b2lkIHtcbiAgICBjb25zdCBzdG9yYWdlOiBhbnkgPSB0aGlzLl9nZXRMb2NhbFN0b3JhZ2UocGtnTmFtZSk7XG4gICAgaWYgKF8uaXNOaWwoc3RvcmFnZSkpIHtcbiAgICAgIHRoaXMuX2NyZWF0ZU5ld1BhY2thZ2UocGtnTmFtZSwgY2FsbGJhY2spO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN0b3JhZ2UucmVhZFBhY2thZ2UocGtnTmFtZSwgKGVyciwgZGF0YSk6IHZvaWQgPT4ge1xuICAgICAgLy8gVE9ETzogcmFjZSBjb25kaXRpb25cbiAgICAgIGlmIChfLmlzTmlsKGVycikgPT09IGZhbHNlKSB7XG4gICAgICAgIGlmIChlcnIuY29kZSA9PT0gU1RPUkFHRS5OT19TVUNIX0ZJTEVfRVJST1IgfHwgZXJyLmNvZGUgPT09IEhUVFBfU1RBVFVTLk5PVF9GT1VORCkge1xuICAgICAgICAgIGRhdGEgPSBnZW5lcmF0ZVBhY2thZ2VUZW1wbGF0ZShwa2dOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5faW50ZXJuYWxFcnJvcihlcnIsIFNUT1JBR0UuUEFDS0FHRV9GSUxFX05BTUUsICdlcnJvciByZWFkaW5nJykpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNhbGxiYWNrKG51bGwsIG5vcm1hbGl6ZVBhY2thZ2UoZGF0YSkpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlTmV3UGFja2FnZShuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiBDYWxsYmFjayk6IENhbGxiYWNrIHtcbiAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgbm9ybWFsaXplUGFja2FnZShnZW5lcmF0ZVBhY2thZ2VUZW1wbGF0ZShuYW1lKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBpbnRlcm5hbCBlcnJvclxuICAgKiBAcGFyYW0geyp9IGVyclxuICAgKiBAcGFyYW0geyp9IGZpbGVcbiAgICogQHBhcmFtIHsqfSBtZXNzYWdlXG4gICAqIEByZXR1cm4ge09iamVjdH0gRXJyb3IgaW5zdGFuY2VcbiAgICovXG4gIHByaXZhdGUgX2ludGVybmFsRXJyb3IoZXJyOiBzdHJpbmcsIGZpbGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nKTogYW55IHtcbiAgICB0aGlzLmxvZ2dlci5lcnJvcih7IGVycjogZXJyLCBmaWxlOiBmaWxlIH0sIGAke21lc3NhZ2V9ICBAe2ZpbGV9OiBAeyFlcnIubWVzc2FnZX1gKTtcblxuICAgIHJldHVybiBFcnJvckNvZGUuZ2V0SW50ZXJuYWxFcnJvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Kn0gbmFtZSBwYWNrYWdlIG5hbWVcbiAgICogQHBhcmFtIHsqfSB1cGRhdGVIYW5kbGVyIGZ1bmN0aW9uKHBhY2thZ2UsIGNiKSAtIHVwZGF0ZSBmdW5jdGlvblxuICAgKiBAcGFyYW0geyp9IGNhbGxiYWNrIGNhbGxiYWNrIHRoYXQgZ2V0cyBpbnZva2VkIGFmdGVyIGl0J3MgYWxsIHVwZGF0ZWRcbiAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVQYWNrYWdlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB1cGRhdGVIYW5kbGVyOiBTdG9yYWdlVXBkYXRlQ2FsbGJhY2ssXG4gICAgY2FsbGJhY2s6IENhbGxiYWNrXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHN0b3JhZ2UgPSB0aGlzLl9nZXRMb2NhbFN0b3JhZ2UobmFtZSk7XG5cbiAgICBpZiAoIXN0b3JhZ2UpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayhFcnJvckNvZGUuZ2V0Tm90Rm91bmQoKSk7XG4gICAgfVxuXG4gICAgc3RvcmFnZS51cGRhdGVQYWNrYWdlKFxuICAgICAgbmFtZSxcbiAgICAgIHVwZGF0ZUhhbmRsZXIsXG4gICAgICB0aGlzLl93cml0ZVBhY2thZ2UuYmluZCh0aGlzKSxcbiAgICAgIG5vcm1hbGl6ZVBhY2thZ2UsXG4gICAgICBjYWxsYmFja1xuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSByZXZpc2lvbiAoX3Jldikgc3RyaW5nIGZvciBhIHBhY2thZ2UuXG4gICAqIEBwYXJhbSB7Kn0gbmFtZVxuICAgKiBAcGFyYW0geyp9IGpzb25cbiAgICogQHBhcmFtIHsqfSBjYWxsYmFja1xuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICovXG4gIHByaXZhdGUgX3dyaXRlUGFja2FnZShuYW1lOiBzdHJpbmcsIGpzb246IE1hbmlmZXN0LCBjYWxsYmFjazogQ2FsbGJhY2spOiB2b2lkIHtcbiAgICBjb25zdCBzdG9yYWdlOiBhbnkgPSB0aGlzLl9nZXRMb2NhbFN0b3JhZ2UobmFtZSk7XG4gICAgaWYgKF8uaXNOaWwoc3RvcmFnZSkpIHtcbiAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH1cbiAgICBzdG9yYWdlLnNhdmVQYWNrYWdlKG5hbWUsIHRoaXMuX3NldERlZmF1bHRSZXZpc2lvbihqc29uKSwgY2FsbGJhY2spO1xuICB9XG5cbiAgcHJpdmF0ZSBfc2V0RGVmYXVsdFJldmlzaW9uKGpzb246IE1hbmlmZXN0KTogTWFuaWZlc3Qge1xuICAgIC8vIGNhbGN1bGF0ZSByZXZpc2lvbiBmcm9tIGNvdWNoIGRiXG4gICAgaWYgKF8uaXNTdHJpbmcoanNvbi5fcmV2KSA9PT0gZmFsc2UpIHtcbiAgICAgIGpzb24uX3JldiA9IFNUT1JBR0UuREVGQVVMVF9SRVZJU0lPTjtcbiAgICB9XG5cbiAgICAvLyB0aGlzIGlzIGludGVuZGVkIGluIGRlYnVnIG1vZGUgd2UgZG8gbm90IHdhbnQgbW9kaWZ5IHRoZSBzdG9yZSByZXZpc2lvblxuICAgIGlmIChfLmlzTmlsKHRoaXMuY29uZmlnLl9kZWJ1ZykpIHtcbiAgICAgIGpzb24uX3JldiA9IGdlbmVyYXRlUmV2aXNpb24oanNvbi5fcmV2KTtcbiAgICB9XG5cbiAgICByZXR1cm4ganNvbjtcbiAgfVxuXG4gIHByaXZhdGUgX2RlbGV0ZUF0dGFjaG1lbnRzKHN0b3JhZ2U6IGFueSwgYXR0YWNobWVudHM6IHN0cmluZ1tdLCBjYWxsYmFjazogQ2FsbGJhY2spOiB2b2lkIHtcbiAgICBkZWJ1ZygnW3N0b3JhZ2UvX2RlbGV0ZUF0dGFjaG1lbnRzXSBkZWxldGUgYXR0YWNobWVudHMgdG90YWw6ICVvJywgYXR0YWNobWVudHM/Lmxlbmd0aCk7XG4gICAgY29uc3QgdW5saW5rTmV4dCA9IGZ1bmN0aW9uIChjYik6IHZvaWQge1xuICAgICAgaWYgKF8uaXNFbXB0eShhdHRhY2htZW50cykpIHtcbiAgICAgICAgcmV0dXJuIGNiKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGF0dGFjaG1lbnQgPSBhdHRhY2htZW50cy5zaGlmdCgpO1xuICAgICAgc3RvcmFnZS5kZWxldGVQYWNrYWdlKGF0dGFjaG1lbnQsIGZ1bmN0aW9uICgpOiB2b2lkIHtcbiAgICAgICAgdW5saW5rTmV4dChjYik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgdW5saW5rTmV4dChmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAgICAvLyB0cnkgdG8gdW5saW5rIHRoZSBkaXJlY3RvcnksIGJ1dCBpZ25vcmUgZXJyb3JzIGJlY2F1c2UgaXQgY2FuIGZhaWxcbiAgICAgIHN0b3JhZ2UucmVtb3ZlUGFja2FnZShmdW5jdGlvbiAoZXJyKTogdm9pZCB7XG4gICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbnN1cmUgdGhlIGRpc3QgZmlsZSByZW1haW5zIGFzIHRoZSBzYW1lIHByb3RvY29sXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoIG1ldGFkYXRhXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB1cExpbmtLZXkgcmVnaXN0cnkga2V5XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF91cGRhdGVVcGxpbmtUb1JlbW90ZVByb3RvY29sKGhhc2g6IERpc3RGaWxlLCB1cExpbmtLZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIC8vIGlmIHdlIGdvdCB0aGlzIGluZm9ybWF0aW9uIGZyb20gYSBrbm93biByZWdpc3RyeSxcbiAgICAvLyB1c2UgdGhlIHNhbWUgcHJvdG9jb2wgZm9yIHRoZSB0YXJiYWxsXG4gICAgLy9cbiAgICAvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3JsaWR3a2Evc2lub3BpYS9pc3N1ZXMvMTY2XG4gICAgY29uc3QgdGFyYmFsbFVybDogYW55ID0gVXJsTm9kZS5wYXJzZShoYXNoLnVybCk7XG4gICAgY29uc3QgdXBsaW5rVXJsOiBhbnkgPSBVcmxOb2RlLnBhcnNlKHRoaXMuY29uZmlnLnVwbGlua3NbdXBMaW5rS2V5XS51cmwpO1xuXG4gICAgaWYgKHVwbGlua1VybC5ob3N0ID09PSB0YXJiYWxsVXJsLmhvc3QpIHtcbiAgICAgIHRhcmJhbGxVcmwucHJvdG9jb2wgPSB1cGxpbmtVcmwucHJvdG9jb2w7XG4gICAgICBoYXNoLnJlZ2lzdHJ5ID0gdXBMaW5rS2V5O1xuICAgICAgaGFzaC51cmwgPSBVcmxOb2RlLmZvcm1hdCh0YXJiYWxsVXJsKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0U2VjcmV0KGNvbmZpZzogQ29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZWNyZXRLZXkgPSBhd2FpdCB0aGlzLnN0b3JhZ2VQbHVnaW4uZ2V0U2VjcmV0KCk7XG5cbiAgICByZXR1cm4gdGhpcy5zdG9yYWdlUGx1Z2luLnNldFNlY3JldChjb25maWcuY2hlY2tTZWNyZXRLZXkoc2VjcmV0S2V5KSk7XG4gIH1cblxuICBwdWJsaWMgc2F2ZVRva2VuKHRva2VuOiBUb2tlbik6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbih0aGlzLnN0b3JhZ2VQbHVnaW4uc2F2ZVRva2VuKSA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgRXJyb3JDb2RlLmdldENvZGUoSFRUUF9TVEFUVVMuU0VSVklDRV9VTkFWQUlMQUJMRSwgU1VQUE9SVF9FUlJPUlMuUExVR0lOX01JU1NJTkdfSU5URVJGQUNFKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5zdG9yYWdlUGx1Z2luLnNhdmVUb2tlbih0b2tlbik7XG4gIH1cblxuICBwdWJsaWMgZGVsZXRlVG9rZW4odXNlcjogc3RyaW5nLCB0b2tlbktleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKHRoaXMuc3RvcmFnZVBsdWdpbi5kZWxldGVUb2tlbikgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIEVycm9yQ29kZS5nZXRDb2RlKEhUVFBfU1RBVFVTLlNFUlZJQ0VfVU5BVkFJTEFCTEUsIFNVUFBPUlRfRVJST1JTLlBMVUdJTl9NSVNTSU5HX0lOVEVSRkFDRSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc3RvcmFnZVBsdWdpbi5kZWxldGVUb2tlbih1c2VyLCB0b2tlbktleSk7XG4gIH1cblxuICBwdWJsaWMgcmVhZFRva2VucyhmaWx0ZXI6IFRva2VuRmlsdGVyKTogUHJvbWlzZTxUb2tlbltdPiB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbih0aGlzLnN0b3JhZ2VQbHVnaW4ucmVhZFRva2VucykgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIEVycm9yQ29kZS5nZXRDb2RlKEhUVFBfU1RBVFVTLlNFUlZJQ0VfVU5BVkFJTEFCTEUsIFNVUFBPUlRfRVJST1JTLlBMVUdJTl9NSVNTSU5HX0lOVEVSRkFDRSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc3RvcmFnZVBsdWdpbi5yZWFkVG9rZW5zKGZpbHRlcik7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTG9jYWxTdG9yYWdlO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxNQUFBLEdBQUFGLHNCQUFB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