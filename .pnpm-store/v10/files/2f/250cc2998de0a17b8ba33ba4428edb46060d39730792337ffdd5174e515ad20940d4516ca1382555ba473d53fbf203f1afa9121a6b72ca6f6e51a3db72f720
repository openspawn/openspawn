"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createTarballHash = createTarballHash;
exports.defaultTarballHashAlgorithm = void 0;
exports.generateRandomHexString = generateRandomHexString;
exports.mask = mask;
exports.stringToMD5 = stringToMD5;
var _nodeCrypto = require("node:crypto");
const defaultTarballHashAlgorithm = exports.defaultTarballHashAlgorithm = 'sha1';
function createTarballHash() {
  return (0, _nodeCrypto.createHash)(defaultTarballHashAlgorithm);
}

/**
 * Express doesn't do ETAGS with requests <= 1024b
 * we use md5 here, it works well on 1k+ bytes, but sucks with fewer data
 * could improve performance using crc32 after benchmarks.
 * @param {Object} data
 * @return {String}
 */
function stringToMD5(data) {
  // @ts-ignore update method accepts Buffer or string
  return (0, _nodeCrypto.createHash)('md5').update(data).digest('hex');
}
function generateRandomHexString(length = 8) {
  return (0, _nodeCrypto.pseudoRandomBytes)(length).toString('hex');
}

/**
 * return a masquerade string with its first and last {charNum} and three dots in between.
 * @param {String} str
 * @param {Number} charNum
 * @returns {String}
 */
function mask(str, charNum = 3) {
  return `${str.slice(0, charNum)}...${str.slice(-charNum)}`;
}
//# sourceMappingURL=crypto-utils.js.map