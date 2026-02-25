"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.signPayload = signPayload;
exports.verifyPayload = verifyPayload;
var _debug = _interopRequireDefault(require("debug"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:auth:token:jwt');
/**
 * Sign the payload and return JWT
 * https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
 * @param payload
 * @param secretOrPrivateKey
 * @param options
 */
async function signPayload(payload, secretOrPrivateKey, options = {}) {
  return new Promise(function (resolve, reject) {
    debug('sign jwt token');
    _jsonwebtoken.default.sign(payload, secretOrPrivateKey,
    // FIXME: upgrade to the latest library and types
    {
      // 1 === 1ms (one millisecond)
      notBefore: '1ms',
      // Make sure the time will not rollback :)
      ...options
    }, (error, token) => {
      if (error) {
        debug('error on sign jwt token %s', error.message);
        return reject(error);
      }
      debug('signed jwt token successfully');
      return resolve(token);
    });
  });
}
function verifyPayload(token, secretOrPrivateKey, options = {}) {
  debug('verifying jwt token');
  return _jsonwebtoken.default.verify(token, secretOrPrivateKey, options);
}
//# sourceMappingURL=jwt-token.js.map