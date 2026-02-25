"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TOKEN_VALID_LENGTH = void 0;
exports.generateRandomSecretKey = generateRandomSecretKey;
var _nodeCrypto = require("node:crypto");
const TOKEN_VALID_LENGTH = exports.TOKEN_VALID_LENGTH = 32;

/**
 * Secret key must have 32 characters.
 */
function generateRandomSecretKey() {
  return (0, _nodeCrypto.randomBytes)(TOKEN_VALID_LENGTH).toString('base64').substring(0, TOKEN_VALID_LENGTH);
}
//# sourceMappingURL=token.js.map