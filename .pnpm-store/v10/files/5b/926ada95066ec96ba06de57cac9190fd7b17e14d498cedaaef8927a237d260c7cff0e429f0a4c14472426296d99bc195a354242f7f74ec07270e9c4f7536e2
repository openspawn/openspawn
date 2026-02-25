"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EncryptionMethod = void 0;
exports.createSalt = createSalt;
exports.default = crypt3;
var _unixCryptTdJs = _interopRequireDefault(require("unix-crypt-td-js"));
var _cryptoUtils = require("./crypto-utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
let EncryptionMethod = exports.EncryptionMethod = /*#__PURE__*/function (EncryptionMethod) {
  EncryptionMethod["md5"] = "md5";
  EncryptionMethod["sha1"] = "sha1";
  EncryptionMethod["crypt"] = "crypt";
  EncryptionMethod["blowfish"] = "blowfish";
  EncryptionMethod["sha256"] = "sha256";
  EncryptionMethod["sha512"] = "sha512";
  return EncryptionMethod;
}({});
/**
 * Create salt
 * @param {EncryptionMethod} type The type of salt: md5, blowfish (only some linux
 * distros), sha256 or sha512. Default is sha512.
 * @returns {string} Generated salt string
 */
function createSalt(type = EncryptionMethod.crypt) {
  switch (type) {
    case EncryptionMethod.crypt:
      // Legacy crypt salt with no prefix (only the first 2 bytes will be used).
      return (0, _cryptoUtils.randomBytes)(2).toString('base64');
    case EncryptionMethod.md5:
      return '$1$' + (0, _cryptoUtils.randomBytes)(10).toString('base64');
    case EncryptionMethod.blowfish:
      return '$2a$' + (0, _cryptoUtils.randomBytes)(10).toString('base64');
    case EncryptionMethod.sha256:
      return '$5$' + (0, _cryptoUtils.randomBytes)(10).toString('base64');
    case EncryptionMethod.sha512:
      return '$6$' + (0, _cryptoUtils.randomBytes)(10).toString('base64');
    default:
      throw new TypeError(`Unknown salt type at crypt3.createSalt: ${type}`);
  }
}

/**
 * Crypt(3) password and data encryption.
 * @param {string} key user's typed password
 * @param {string} salt Optional salt, for example SHA-512 use "$6$salt$".
 * @returns {string} A generated hash in format $id$salt$encrypted
 * @see https://en.wikipedia.org/wiki/Crypt_(C)
 */

function crypt3(key, salt = createSalt()) {
  return (0, _unixCryptTdJs.default)(key, salt);
}
//# sourceMappingURL=crypt3.js.map