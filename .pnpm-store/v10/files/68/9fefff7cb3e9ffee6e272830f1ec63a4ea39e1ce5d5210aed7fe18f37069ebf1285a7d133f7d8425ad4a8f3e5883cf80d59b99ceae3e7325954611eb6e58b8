"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TOKEN_VALID_LENGTH_DEPRECATED = void 0;
exports.aesDecryptDeprecated = aesDecryptDeprecated;
exports.aesEncryptDeprecated = aesEncryptDeprecated;
exports.defaultAlgorithm = void 0;
exports.generateRandomSecretKeyDeprecated = generateRandomSecretKeyDeprecated;
var _debug = _interopRequireDefault(require("debug"));
var _nodeCrypto = require("node:crypto");
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const defaultAlgorithm = exports.defaultAlgorithm = 'aes192';
const debug = (0, _debug.default)('verdaccio:auth:token:legacy:deprecated');

/**
 *
 * @param buf
 * @param secret
 * @returns
 */
function aesEncryptDeprecated(buf, secret) {
  debug('aesEncryptDeprecated init');
  debug('algorithm %o', defaultAlgorithm);
  // deprecated (it will be removed in Verdaccio 6), it is a breaking change
  // https://nodejs.org/api/crypto.html#crypto_crypto_createcipher_algorithm_password_options
  // https://www.grainger.xyz/changing-from-cipher-to-cipheriv/
  const c = (0, _nodeCrypto.createCipher)(defaultAlgorithm, secret);
  const b1 = c.update(buf);
  const b2 = c.final();
  debug('deprecated legacy token generated successfully');
  return Buffer.concat([b1, b2]);
}

/**
 *
 * @param buf
 * @param secret
 * @returns
 */
function aesDecryptDeprecated(buf, secret) {
  try {
    debug('aesDecryptDeprecated init');
    // https://nodejs.org/api/crypto.html#crypto_crypto_createdecipher_algorithm_password_options
    // https://www.grainger.xyz/changing-from-cipher-to-cipheriv/
    const c = (0, _nodeCrypto.createDecipher)(defaultAlgorithm, secret);
    const b1 = c.update(buf);
    const b2 = c.final();
    debug('deprecated legacy token payload decrypted successfully');
    return Buffer.concat([b1, b2]);
  } catch (_) {
    return Buffer.alloc(0);
  }
}
const TOKEN_VALID_LENGTH_DEPRECATED = exports.TOKEN_VALID_LENGTH_DEPRECATED = 64;

/**
 * Generate a secret key of 64 characters.
 */
function generateRandomSecretKeyDeprecated() {
  return _core.cryptoUtils.generateRandomHexString(6);
}
//# sourceMappingURL=index.js.map