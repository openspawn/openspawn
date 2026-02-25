"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTarballHash = createTarballHash;
exports.defaultTarballHashAlgorithm = void 0;
exports.generateRandomHexString = generateRandomHexString;
exports.stringToMD5 = stringToMD5;
var _nodeCrypto = require("node:crypto");
const defaultTarballHashAlgorithm = exports.defaultTarballHashAlgorithm = 'sha1';

// @deprecated use @verdaccio/core
function createTarballHash() {
  return (0, _nodeCrypto.createHash)(defaultTarballHashAlgorithm);
}

/**
 * Express doesn't do ETAGS with requests <= 1024b
 * we use md5 here, it works well on 1k+ bytes, but sucks with fewer data
 * could improve performance using crc32 after benchmarks.
 * @param {Object} data
 * @return {String}
 * @deprecated use @verdaccio/core
 */
function stringToMD5(data) {
  return (0, _nodeCrypto.createHash)('md5').update(data).digest('hex');
}

// @deprecated use @verdaccio/core
function generateRandomHexString(length = 8) {
  return (0, _nodeCrypto.pseudoRandomBytes)(length).toString('hex');
}
//# sourceMappingURL=crypto-utils.js.map