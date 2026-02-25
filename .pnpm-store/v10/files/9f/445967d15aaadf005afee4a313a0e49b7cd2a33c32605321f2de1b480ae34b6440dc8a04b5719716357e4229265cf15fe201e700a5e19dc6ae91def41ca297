"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DEFAULT_SLOW_VERIFY_MS = void 0;
var _debug = _interopRequireDefault(require("debug"));
var _nodeFs = require("node:fs");
var _nodePath = require("node:path");
var _core = require("@verdaccio/core");
var _fileLocking = require("@verdaccio/file-locking");
var _utils = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:plugin:htpasswd');
const DEFAULT_SLOW_VERIFY_MS = exports.DEFAULT_SLOW_VERIFY_MS = 200;

/**
 * HTPasswd - Verdaccio auth class
 */
class HTPasswd extends _core.pluginUtils.Plugin {
  /**
   *
   * @param {*} config htpasswd file
   * @param {object} options config.yaml in object from
   */

  // constructor
  constructor(config, options) {
    super(config, options);
    this.users = {};

    // verdaccio logger
    this.logger = options.logger;

    // all this "verdaccio_config" stuff is for b/w compatibility only
    this.maxUsers = config.max_users ? config.max_users : Infinity;
    let algorithm;
    let rounds;
    if (typeof config.algorithm === 'undefined') {
      algorithm = _core.constants.HtpasswdHashAlgorithm.bcrypt;
    } else if (_core.constants.HtpasswdHashAlgorithm[config.algorithm] !== undefined) {
      algorithm = _core.constants.HtpasswdHashAlgorithm[config.algorithm];
    } else {
      this.logger.warn(`The algorithm selected %s is invalid, switching to to default one "bcrypt", password validation can be affected`, config.algorithm);
      algorithm = _core.constants.HtpasswdHashAlgorithm.bcrypt;
    }
    debug(`password hash algorithm: ${algorithm}`);
    if (algorithm === _core.constants.HtpasswdHashAlgorithm.bcrypt) {
      rounds = config.rounds || _utils.DEFAULT_BCRYPT_ROUNDS;
    } else if (config.rounds !== undefined) {
      this.logger.warn({
        algo: algorithm
      }, 'Option "rounds" is not valid for "@{algo}" algorithm');
    }
    this.hashConfig = {
      algorithm,
      rounds
    };
    this.lastTime = null;
    const {
      file
    } = config;
    debug('file: %s', file);
    if (!file) {
      throw new Error('should specify "file" in config');
    }
    debug('config path: %s', options?.config?.configPath);
    this.path = (0, _nodePath.resolve)((0, _nodePath.dirname)(options?.config?.configPath), file);
    this.logger.info({
      file: this.path
    }, 'using htpasswd file: @{file}');
    debug('htpasswd path:', this.path);
    if (config.slow_verify_ms) {
      this.logger.info({
        ms: config.slow_verify_ms
      }, 'slow_verify_ms enabled for @{ms}');
    }
    this.slowVerifyMs = config.slow_verify_ms || DEFAULT_SLOW_VERIFY_MS;
  }

  /**
   * authenticate - Authenticate user.
   * @param {string} user
   * @param {string} password
   * @param {function} cb
   * @returns {void}
   */
  authenticate(user, password, cb) {
    debug('authenticate %s', user);
    this.reload(async err => {
      debug('reloaded');
      if (err) {
        debug('error %o', err);
        return cb(err.code === 'ENOENT' ? null : err);
      }
      if (!this.users[user]) {
        debug('user %s not found', user);
        return cb(null, false);
      }
      let passwordValid = false;
      try {
        const start = new Date();
        passwordValid = await (0, _utils.verifyPassword)(password, this.users[user]);
        const durationMs = new Date().getTime() - start.getTime();
        if (durationMs > this.slowVerifyMs) {
          debug('password for user "%s" took %sms to verify', user, durationMs);
          this.logger.warn({
            user,
            durationMs
          }, 'Password for user "@{user}" took @{durationMs}ms to verify');
        }
      } catch (error) {
        this.logger.error({
          message: err.message
        }, 'Unable to verify user password: @{message}');
      }
      if (!passwordValid) {
        debug('password invalid for %s', user);
        return cb(null, false);
      }

      // authentication succeeded!
      // return all usergroups this user has access to;
      // (this particular package has no concept of usergroups, so just return
      // user herself)
      return cb(null, [user]);
    });
  }

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
  async adduser(user, password, realCb) {
    const pathPass = this.path;
    debug('adduser %s', user);
    let sanity = await (0, _utils.sanityCheck)(user, password, _utils.verifyPassword, this.users, this.maxUsers);
    debug('sanity check: %s', sanity);
    // preliminary checks, just to ensure that file won't be reloaded if it's
    // not needed
    if (sanity) {
      debug('sanity check failed');
      return realCb(sanity, false);
    }
    (0, _utils.lockAndRead)(pathPass, async (err, res) => {
      let locked = false;
      debug('locked and read');

      // callback that cleans up lock first
      const cb = err => {
        if (locked) {
          (0, _fileLocking.unlockFile)(pathPass, () => {
            // ignore any error from the unlock
            realCb(err, !err);
          });
        } else {
          realCb(err, !err);
        }
      };
      if (!err) {
        debug('locked');
        locked = true;
      }

      // ignore ENOENT errors, we'll just create .htpasswd in that case
      if (err && err.code !== 'ENOENT') {
        return cb(err);
      }
      debug('read file');
      const body = (res || '').toString('utf8');
      this.users = (0, _utils.parseHTPasswd)(body);
      debug('parsed users');
      // real checks, to prevent race conditions
      // parsing users after reading file.
      sanity = await (0, _utils.sanityCheck)(user, password, _utils.verifyPassword, this.users, this.maxUsers);
      debug('sanity check: %s', sanity);
      if (sanity) {
        debug('sanity check failed');
        return cb(sanity);
      }
      try {
        debug('add user to htpasswd file');
        this._writeFile(await (0, _utils.addUserToHTPasswd)(body, user, password, this.hashConfig), cb);
        debug('user added');
      } catch (err) {
        debug('error %o', err);
        return cb(err);
      }
    });
  }

  /**
   * Reload users
   * @param {function} callback
   */
  reload(callback) {
    debug('reload users');
    debug('path: %s', this.path);
    (0, _nodeFs.stat)(this.path, (err, stats) => {
      if (err) {
        return callback(err);
      }
      if (this.lastTime === stats.mtime) {
        return callback();
      }
      this.lastTime = stats.mtime;
      (0, _nodeFs.readFile)(this.path, 'utf8', (err, buffer) => {
        if (err) {
          return callback(err);
        }
        debug('reload users total: %s', Object.keys(this.users).length);
        Object.assign(this.users, (0, _utils.parseHTPasswd)(buffer));
        callback();
      });
    });
  }
  _writeFile(body, cb) {
    (0, _nodeFs.writeFile)(this.path, body, err => {
      if (err) {
        cb(err);
      } else {
        this.reload(() => {
          cb(null);
        });
      }
    });
  }

  /**
   * changePassword - change password for existing user.
   * @param {string} user
   * @param {string} password
   * @param {string} newPassword
   * @param {function} realCb
   * @returns {function}
   */
  changePassword(user, password, newPassword, realCb) {
    debug('change password %s', user);
    (0, _utils.lockAndRead)(this.path, async (err, res) => {
      debug('locked and read');
      let locked = false;
      const pathPassFile = this.path;

      // callback that cleans up lock first
      const cb = err => {
        if (locked) {
          (0, _fileLocking.unlockFile)(pathPassFile, () => {
            // ignore any error from the unlock
            realCb(err, !err);
          });
        } else {
          realCb(err, !err);
        }
      };
      if (!err) {
        locked = true;
      }
      if (err && err.code !== 'ENOENT') {
        return cb(err);
      }
      const body = (0, _utils.stringToUtf8)(res);
      this.users = (0, _utils.parseHTPasswd)(body);
      try {
        debug('change password for user %s', user);
        this._writeFile(await (0, _utils.changePasswordToHTPasswd)(body, user, password, newPassword, this.hashConfig), cb);
      } catch (err) {
        debug('error changing password %o', err);
        return cb(err);
      }
    });
  }
}
exports.default = HTPasswd;
//# sourceMappingURL=htpasswd.js.map