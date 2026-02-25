"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_BCRYPT_ROUNDS = void 0;
exports.addUserToHTPasswd = addUserToHTPasswd;
exports.changePasswordToHTPasswd = changePasswordToHTPasswd;
exports.generateHtpasswdLine = generateHtpasswdLine;
exports.lockAndRead = lockAndRead;
exports.parseHTPasswd = parseHTPasswd;
exports.sanityCheck = sanityCheck;
exports.stringToUtf8 = stringToUtf8;
exports.verifyPassword = verifyPassword;
var _apacheMd = _interopRequireDefault(require("apache-md5"));
var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
var _debug = _interopRequireDefault(require("debug"));
var _httpErrors = _interopRequireDefault(require("http-errors"));
var _nodeCrypto = _interopRequireDefault(require("node:crypto"));
var _core = require("@verdaccio/core");
var _fileLocking = require("@verdaccio/file-locking");
var _crypt = _interopRequireDefault(require("./crypt3"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:plugin:htpasswd:utils');
const DEFAULT_BCRYPT_ROUNDS = exports.DEFAULT_BCRYPT_ROUNDS = 10;
// this function neither unlocks file nor closes it
// it'll have to be done manually later
function lockAndRead(name, cb) {
  (0, _fileLocking.readFile)(name, {
    lock: true
  }, (err, res) => {
    if (err) {
      return cb(err);
    }
    return cb(null, res);
  });
}

/**
 * parseHTPasswd - convert htpasswd lines to object.
 * @param {string} input
 * @returns {object}
 */
function parseHTPasswd(input) {
  // The input is split on line ending styles that are both windows and unix compatible
  return input.split(/[\r]?[\n]/).reduce((result, line) => {
    const args = line.split(':', 3).map(str => str.trim());
    if (args.length > 1) {
      result[args[0]] = args[1];
    }
    return result;
  }, {});
}

/**
 * verifyPassword - matches password and it's hash.
 * @param {string} passwd
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(passwd, hash) {
  if (hash.match(/^\$2([aby])\$/)) {
    return await _bcryptjs.default.compare(passwd, hash);
  } else if (hash.indexOf('{PLAIN}') === 0) {
    return passwd === hash.slice(7);
  } else if (hash.indexOf('{SHA}') === 0) {
    return _nodeCrypto.default.createHash('sha1')
    // https://nodejs.org/api/crypto.html#crypto_hash_update_data_inputencoding
    .update(passwd, 'utf8').digest('base64') === hash.slice(5);
  }
  // for backwards compatibility, first check md5 then check crypt3
  return (0, _apacheMd.default)(passwd, hash) === hash || (0, _crypt.default)(passwd, hash) === hash;
}

/**
 * generateHtpasswdLine - generates line for htpasswd file.
 * @param {string} user
 * @param {string} passwd
 * @param {HtpasswdHashConfig} hashConfig
 * @returns {string}
 */
async function generateHtpasswdLine(user, passwd, hashConfig) {
  let hash;
  debug('algorithm %o', hashConfig.algorithm);
  switch (hashConfig.algorithm) {
    case _core.constants.HtpasswdHashAlgorithm.bcrypt:
      hash = await _bcryptjs.default.hash(passwd, hashConfig.rounds || DEFAULT_BCRYPT_ROUNDS);
      break;
    case _core.constants.HtpasswdHashAlgorithm.crypt:
      hash = (0, _crypt.default)(passwd);
      break;
    case _core.constants.HtpasswdHashAlgorithm.md5:
      hash = (0, _apacheMd.default)(passwd);
      break;
    case _core.constants.HtpasswdHashAlgorithm.sha1:
      hash = '{SHA}' + _nodeCrypto.default.createHash('sha1').update(passwd, 'utf8').digest('base64');
      break;
    default:
      throw (0, _httpErrors.default)('Unexpected hash algorithm');
  }
  const comment = 'autocreated ' + new Date().toJSON();
  return `${user}:${hash}:${comment}\n`;
}

/**
 * addUserToHTPasswd - Generate a htpasswd format for .htpasswd
 * @param {string} body
 * @param {string} user
 * @param {string} passwd
 * @param {HtpasswdHashConfig} hashConfig
 * @returns {string}
 */
async function addUserToHTPasswd(body, user, passwd, hashConfig) {
  if (user !== encodeURIComponent(user)) {
    const err = (0, _httpErrors.default)('username should not contain non-uri-safe characters');
    err.status = _core.HTTP_STATUS.CONFLICT;
    throw err;
  }
  let newline = await generateHtpasswdLine(user, passwd, hashConfig);
  if (body.length && body[body.length - 1] !== '\n') {
    newline = '\n' + newline;
  }
  return body + newline;
}

/**
 * Sanity check for a user
 * @param {string} user
 * @param {object} users
 * @param {string} password
 * @param {Callback} verifyFn
 * @param {number} maxUsers
 * @returns {object}
 */
async function sanityCheck(user, password, verifyFn, users, maxUsers) {
  let err;

  // check for user or password
  if (!user || !password) {
    debug('username or password is missing');
    err = Error(_core.API_ERROR.USERNAME_PASSWORD_REQUIRED);
    err.status = _core.HTTP_STATUS.BAD_REQUEST;
    return err;
  }
  const hash = users[user];
  if (maxUsers < 0) {
    debug('registration is disabled');
    err = Error(_core.API_ERROR.REGISTRATION_DISABLED);
    err.status = _core.HTTP_STATUS.CONFLICT;
    return err;
  }
  if (hash) {
    const auth = await verifyFn(password, users[user]);
    if (auth) {
      debug(`user ${user} already exists`);
      err = Error(_core.API_ERROR.USERNAME_ALREADY_REGISTERED);
      err.status = _core.HTTP_STATUS.CONFLICT;
      return err;
    }
    debug(`user ${user} exists but password is wrong`);
    err = Error(_core.API_ERROR.UNAUTHORIZED_ACCESS);
    err.status = _core.HTTP_STATUS.UNAUTHORIZED;
    return err;
  } else if (Object.keys(users).length >= maxUsers) {
    debug('maximum amount of users reached');
    err = Error(_core.API_ERROR.MAX_USERS_REACHED);
    err.status = _core.HTTP_STATUS.FORBIDDEN;
    return err;
  }
  debug('sanity check passed');
  return null;
}

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
async function changePasswordToHTPasswd(body, user, passwd, newPasswd, hashConfig) {
  debug('change password for user %o', user);
  let lines = body.split('\n');
  const userLineIndex = lines.findIndex(line => line.split(':', 1).shift() === user);
  if (userLineIndex === -1) {
    debug('user %o does not exist', user);
    throw new Error(`Unable to change password for user '${user}': user does not currently exist`);
  }
  const [username, hash] = lines[userLineIndex].split(':', 2);
  const passwordValid = await verifyPassword(passwd, hash);
  if (!passwordValid) {
    debug(`invalid old password`);
    throw new Error(`Unable to change password for user '${user}': invalid old password`);
  }
  const updatedUserLine = await generateHtpasswdLine(username, newPasswd, hashConfig);
  lines.splice(userLineIndex, 1, updatedUserLine);
  debug('password changed');
  return lines.join('\n');
}
function stringToUtf8(authentication) {
  return (authentication || '').toString();
}
//# sourceMappingURL=utils.js.map