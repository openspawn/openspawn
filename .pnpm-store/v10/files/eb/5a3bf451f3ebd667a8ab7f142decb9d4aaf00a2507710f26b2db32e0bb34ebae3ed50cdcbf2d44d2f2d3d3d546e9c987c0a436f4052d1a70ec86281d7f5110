"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.final = final;
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:middleware:final');
function final(body, req, res,
// if we remove `next` breaks test
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
  if (res.statusCode === _core.HTTP_STATUS.UNAUTHORIZED && !res.getHeader(_core.HEADERS.WWW_AUTH)) {
    debug('set auth header support');
    res.header(_core.HEADERS.WWW_AUTH, `${_core.TOKEN_BASIC}, ${_core.TOKEN_BEARER}`);
  }
  try {
    if (_lodash.default.isString(body) || _lodash.default.isObject(body)) {
      if (!res.get(_core.HEADERS.CONTENT_TYPE)) {
        debug('set json type header support');
        res.header(_core.HEADERS.CONTENT_TYPE, _core.HEADERS.JSON);
      }
      if (typeof body === 'object' && _lodash.default.isNil(body) === false) {
        if (typeof body.error === 'string') {
          debug('set verdaccio_error method');
          res.locals._verdaccio_error = body.error;
        }
        body = JSON.stringify(body, undefined, '  ') + '\n';
      }

      // don't send etags with errors
      if (!res.statusCode || res.statusCode >= _core.HTTP_STATUS.OK && res.statusCode < _core.HTTP_STATUS.MULTIPLE_CHOICES) {
        const etag = _core.cryptoUtils.stringToMD5(body);
        debug('set etag header %s', etag);
        res.header(_core.HEADERS.ETAG, '"' + etag + '"');
      }
    } else {
      debug('this line should never be visible, if does report');
      // send(null), send(204), etc.
    }
  } catch (err) {
    // if verdaccio sends headers first, and then calls res.send()
    // as an error handler, we can't report error properly,
    // and should just close socket
    if (err.message.match(/set headers after they are sent/)) {
      debug('set headers after they are sent');
      if (_lodash.default.isNil(res.socket) === false) {
        debug('force destroy socket');
        res.socket?.destroy();
      }
      return;
    }
    throw err;
  }
  res.send(body);
}
//# sourceMappingURL=final.js.map