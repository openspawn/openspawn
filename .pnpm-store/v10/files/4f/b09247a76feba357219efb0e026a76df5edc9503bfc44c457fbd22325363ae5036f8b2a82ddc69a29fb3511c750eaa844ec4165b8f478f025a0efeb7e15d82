"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resourceNotAvailable = exports.pkgFileName = exports.noSuchFile = exports.fileExist = exports.fSError = exports.default = void 0;
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _mkdirp = _interopRequireDefault(require("mkdirp"));
var _streams = require("@verdaccio/streams");
var _fileLocking = require("@verdaccio/file-locking");
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /* eslint-disable no-undef */
const fileExist = exports.fileExist = 'EEXISTS';
const noSuchFile = exports.noSuchFile = 'ENOENT';
const resourceNotAvailable = exports.resourceNotAvailable = 'EAGAIN';
const pkgFileName = exports.pkgFileName = 'package.json';
const debug = (0, _debug.default)('verdaccio:plugin:local-storage-legacy:fs');
const {
  getCode,
  getInternalError,
  getNotFound
} = _core.errorUtils;
const fSError = function (message, code = 409) {
  const err = getCode(code, message);
  // FIXME: we should return http-status codes here instead, future improvement
  // @ts-ignore
  err.code = message;
  return err;
};
exports.fSError = fSError;
const tempFile = function (str) {
  return `${str}.tmp${String(Math.random()).substr(2)}`;
};
const renameTmp = function (src, dst, _cb) {
  const cb = err => {
    if (err) {
      _nodeFs.default.unlink(src, () => {});
    }
    _cb(err);
  };
  if (process.platform !== 'win32') {
    return _nodeFs.default.rename(src, dst, cb);
  }

  // windows can't remove opened file,
  // but it seem to be able to rename it
  const tmp = tempFile(dst);
  _nodeFs.default.rename(dst, tmp, function (err) {
    _nodeFs.default.rename(src, dst, cb);
    if (!err) {
      _nodeFs.default.unlink(tmp, () => {});
    }
  });
};
class LocalFS {
  constructor(path, logger) {
    _defineProperty(this, "path", void 0);
    _defineProperty(this, "logger", void 0);
    this.path = path;
    this.logger = logger;
  }

  /**
    *  This function allows to update the package thread-safely
      Algorithm:
      1. lock package.json for writing
      2. read package.json
      3. updateFn(pkg, cb), and wait for cb
      4. write package.json.tmp
      5. move package.json.tmp package.json
      6. callback(err?)
    * @param {*} name
    * @param {*} updateHandler
    * @param {*} onWrite
    * @param {*} transformPackage
    * @param {*} onEnd
    */
  updatePackage(name, updateHandler, onWrite, transformPackage, onEnd) {
    this._lockAndReadJSON(pkgFileName, (err, json) => {
      let locked = false;
      const self = this;
      // callback that cleans up lock first
      const unLockCallback = function (lockError) {
        // eslint-disable-next-line prefer-rest-params
        const _args = arguments;
        if (locked) {
          self._unlockJSON(pkgFileName, () => {
            // ignore any error from the unlock
            if (lockError !== null) {
              debug('lock file: %o has failed with error %o', name, lockError);
            }
            onEnd.apply(lockError, _args);
          });
        } else {
          debug('file: %o has been updated', name);
          onEnd(..._args);
        }
      };
      if (!err) {
        locked = true;
        debug('file: %o has been locked', name);
      }
      if (_lodash.default.isNil(err) === false) {
        if (err.code === resourceNotAvailable) {
          return unLockCallback(getInternalError('resource temporarily unavailable'));
        } else if (err.code === noSuchFile) {
          return unLockCallback(getNotFound());
        } else {
          return unLockCallback(err);
        }
      }
      updateHandler(json, err => {
        if (err) {
          return unLockCallback(err);
        }
        onWrite(name, transformPackage(json), unLockCallback);
      });
    });
  }
  deletePackage(packageName, callback) {
    debug('delete a package %o', packageName);
    return _nodeFs.default.unlink(this._getStorage(packageName), callback);
  }
  removePackage(callback) {
    debug('remove a package %o', this.path);
    _nodeFs.default.rmdir(this._getStorage('.'), callback);
  }
  createPackage(name, value, cb) {
    debug('create a package %o', name);
    this._createFile(this._getStorage(pkgFileName), this._convertToString(value), cb);
  }
  savePackage(name, value, cb) {
    debug('save a package %o', name);
    this._writeFile(this._getStorage(pkgFileName), this._convertToString(value), cb);
  }
  readPackage(name, cb) {
    debug('read a package %o', name);
    this._readStorageFile(this._getStorage(pkgFileName)).then(res => {
      try {
        const data = JSON.parse(res.toString('utf8'));
        debug('read storage file %o has succeed', name);
        cb(null, data);
      } catch (err) {
        debug('parse storage file %o has failed with error %o', name, err);
        cb(err);
      }
    }, err => {
      debug('read storage file %o has failed with error %o', name, err);
      return cb(err);
    });
  }
  writeTarball(name) {
    const uploadStream = new _streams.UploadTarball({});
    debug('write a tarball for a package %o', name);
    let _ended = 0;
    uploadStream.on('end', function () {
      _ended = 1;
    });
    const pathName = this._getStorage(name);
    _nodeFs.default.access(pathName, fileNotFound => {
      const exists = !fileNotFound;
      if (exists) {
        uploadStream.emit('error', fSError(fileExist));
      } else {
        const temporalName = _nodePath.default.join(this.path, `${name}.tmp-${String(Math.random()).replace(/^0\./, '')}`);
        debug('write a temporal name %o', temporalName);
        const file = _nodeFs.default.createWriteStream(temporalName);
        const removeTempFile = () => _nodeFs.default.unlink(temporalName, () => {});
        let opened = false;
        uploadStream.pipe(file);
        uploadStream.done = function () {
          const onend = function () {
            file.on('close', function () {
              renameTmp(temporalName, pathName, function (err) {
                if (err) {
                  uploadStream.emit('error', err);
                } else {
                  uploadStream.emit('success');
                }
              });
            });
            file.end();
          };
          if (_ended) {
            onend();
          } else {
            uploadStream.on('end', onend);
          }
        };
        uploadStream.abort = function () {
          if (opened) {
            opened = false;
            file.on('close', function () {
              removeTempFile();
            });
          } else {
            // if the file does not recieve any byte never is opened and has to be removed anyway.
            removeTempFile();
          }
          file.end();
        };
        file.on('open', function () {
          opened = true;
          // re-emitting open because it's handled in storage.js
          uploadStream.emit('open');
        });
        file.on('error', function (err) {
          uploadStream.emit('error', err);
        });
      }
    });
    return uploadStream;
  }
  readTarball(name) {
    const pathName = this._getStorage(name);
    debug('read a a tarball %o on path %o', name, pathName);
    const readTarballStream = new _streams.ReadTarball({});
    const readStream = _nodeFs.default.createReadStream(pathName);
    readStream.on('error', function (err) {
      debug('error on read a tarball %o with error %o', name, err);
      readTarballStream.emit('error', err);
    });
    readStream.on('open', function (fd) {
      _nodeFs.default.fstat(fd, function (err, stats) {
        if (_lodash.default.isNil(err) === false) {
          debug('error on read a tarball %o with error %o', name, err);
          return readTarballStream.emit('error', err);
        }
        readTarballStream.emit('content-length', stats.size);
        readTarballStream.emit('open');
        debug('open on read a tarball %o', name);
        readStream.pipe(readTarballStream);
      });
    });
    readTarballStream.abort = function () {
      debug('abort on read a tarball %o', name);
      readStream.close();
    };
    return readTarballStream;
  }
  _createFile(name, contents, callback) {
    debug(' create a new file: %o', name);
    _nodeFs.default.open(name, 'wx', err => {
      if (err) {
        // native EEXIST used here to check exception on fs.open
        if (err.code === 'EEXIST') {
          debug('file %o cannot be created, it already exists: %o', name);
          return callback(fSError(fileExist));
        }
      }
      this._writeFile(name, contents, callback);
    });
  }
  _readStorageFile(name) {
    return new Promise((resolve, reject) => {
      debug('reading the file: %o', name);
      _nodeFs.default.readFile(name, (err, data) => {
        if (err) {
          debug('error reading the file: %o with error %o', name, err);
          reject(err);
        } else {
          debug('read file %o succeed', name);
          resolve(data);
        }
      });
    });
  }
  _convertToString(value) {
    return JSON.stringify(value, null, '\t');
  }
  _getStorage(fileName = '') {
    const storagePath = _nodePath.default.join(this.path, fileName);
    return storagePath;
  }
  _writeFile(dest, data, cb) {
    const createTempFile = cb => {
      const tempFilePath = tempFile(dest);
      _nodeFs.default.writeFile(tempFilePath, data, err => {
        if (err) {
          debug('error on write the file: %o', dest);
          return cb(err);
        }
        debug('creating a new file:: %o', dest);
        renameTmp(tempFilePath, dest, cb);
      });
    };
    createTempFile(err => {
      if (err && err.code === noSuchFile) {
        (0, _mkdirp.default)(_nodePath.default.dirname(dest)).then(() => {
          createTempFile(cb);
        }).catch(err => {
          return cb(err);
        });
      } else {
        cb(err);
      }
    });
  }
  _lockAndReadJSON(name, cb) {
    const fileName = this._getStorage(name);
    (0, _fileLocking.readFile)(fileName, {
      lock: true,
      parse: true
    }, (err, res) => {
      if (err) {
        debug('error on lock and read json for file: %o', name);
        return cb(err);
      }
      debug('lock and read json for file: %o', name);
      return cb(null, res);
    });
  }
  _unlockJSON(name, cb) {
    (0, _fileLocking.unlockFile)(this._getStorage(name), cb);
  }
}
exports.default = LocalFS;
//# sourceMappingURL=local-fs.js.map