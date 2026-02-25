"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMiddlewareCredentials = getMiddlewareCredentials;
exports.parseAESCredentials = parseAESCredentials;
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _core = require("@verdaccio/core");
var _signature = require("@verdaccio/signature");
var _utils = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:auth:utils');
function parseAESCredentials(authorizationHeader, secret) {
  debug('parseAESCredentials');
  const {
    scheme,
    token
  } = (0, _utils.parseAuthTokenHeader)(authorizationHeader);

  // basic is deprecated and should not be enforced
  // basic is currently being used for functional test
  if (scheme.toUpperCase() === _core.TOKEN_BASIC.toUpperCase()) {
    debug('legacy header basic');
    const credentials = (0, _utils.convertPayloadToBase64)(token).toString();
    return credentials;
  } else if (scheme.toUpperCase() === _core.TOKEN_BEARER.toUpperCase()) {
    debug('legacy header bearer');
    const credentials = (0, _signature.aesDecryptDeprecated)(Buffer.from(token), secret);
    return credentials;
  }
}
function getMiddlewareCredentials(security, secretKey, authorizationHeader) {
  debug('getMiddlewareCredentials');
  // comment out for debugging purposes
  if ((0, _utils.isAESLegacy)(security)) {
    debug('is legacy');
    const credentials = parseAESCredentials(authorizationHeader, secretKey);
    if (typeof credentials !== 'string') {
      debug('parse legacy credentials failed');
      return;
    }
    const parsedCredentials = (0, _signature.parseBasicPayload)(credentials);
    if (!parsedCredentials) {
      debug('parse legacy basic payload credentials failed');
      return;
    }
    return parsedCredentials;
  }
  const {
    scheme,
    token
  } = (0, _utils.parseAuthTokenHeader)(authorizationHeader);
  debug('is jwt');
  if (_lodash.default.isString(token) && scheme.toUpperCase() === _core.TOKEN_BEARER.toUpperCase()) {
    return (0, _utils.verifyJWTPayload)(token, secretKey, security);
  }
}
//# sourceMappingURL=signature-legacy.js.map