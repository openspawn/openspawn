"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.aesDecrypt = aesDecrypt;
exports.aesEncrypt = aesEncrypt;
exports.defaultAlgorithm = void 0;
var _debug = _interopRequireDefault(require("debug"));
var _nodeCrypto = require("node:crypto");
var _config = require("@verdaccio/config");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:auth:token:legacy');
const defaultAlgorithm = exports.defaultAlgorithm = process.env.VERDACCIO_LEGACY_ALGORITHM || 'aes-256-ctr';
const inputEncoding = 'utf8';
const outputEncoding = 'hex';
// Must be 256 bits (32 characters)
// https://stackoverflow.com/questions/50963160/invalid-key-length-in-crypto-createcipheriv#50963356
const VERDACCIO_LEGACY_ENCRYPTION_KEY = process.env.VERDACCIO_LEGACY_ENCRYPTION_KEY;
function aesEncrypt(value, key) {
  debug('aesEncrypt init');
  // https://nodejs.org/api/crypto.html#crypto_crypto_createcipher_algorithm_password_options
  // https://www.grainger.xyz/posts/changing-from-cipher-to-cipheriv
  debug('algorithm %o', defaultAlgorithm);
  // IV must be a buffer of length 16
  const iv = (0, _nodeCrypto.randomBytes)(16);
  const secretKey = VERDACCIO_LEGACY_ENCRYPTION_KEY || key;
  const isKeyValid = secretKey?.length === _config.TOKEN_VALID_LENGTH;
  if (isKeyValid === false) {
    throw new Error('Invalid secret key length');
  }
  debug('length secret key %o', secretKey?.length);
  debug('is valid secret %o', isKeyValid);
  if (!value || !secretKey || !isKeyValid) {
    return;
  }
  const cipher = (0, _nodeCrypto.createCipheriv)(defaultAlgorithm, secretKey, iv);
  let encrypted = cipher.update(value, inputEncoding, outputEncoding);
  // @ts-ignore
  encrypted += cipher.final(outputEncoding);
  const token = `${iv.toString('hex')}:${encrypted.toString()}`;
  debug('legacy token generated successfully');
  return Buffer.from(token).toString('base64');
}
function aesDecrypt(value, key) {
  try {
    debug('aesDecrypt init');
    const buff = Buffer.from(value, 'base64');
    const textParts = buff.toString().split(':');

    // extract the IV from the first half of the value
    // @ts-ignore
    const IV = Buffer.from(textParts.shift(), outputEncoding);
    // extract the encrypted text without the IV
    const encryptedText = Buffer.from(textParts.join(':'), outputEncoding);
    const secretKey = VERDACCIO_LEGACY_ENCRYPTION_KEY || key;
    // decipher the string
    const decipher = (0, _nodeCrypto.createDecipheriv)(defaultAlgorithm, secretKey, IV);
    // FIXME: fix type here should allow Buffer
    let decrypted = decipher.update(encryptedText, outputEncoding, inputEncoding);
    decrypted += decipher.final(inputEncoding);
    debug('legacy token payload decrypted successfully');
    return decrypted.toString();
  } catch (_) {
    return;
  }
}
//# sourceMappingURL=signature.js.map