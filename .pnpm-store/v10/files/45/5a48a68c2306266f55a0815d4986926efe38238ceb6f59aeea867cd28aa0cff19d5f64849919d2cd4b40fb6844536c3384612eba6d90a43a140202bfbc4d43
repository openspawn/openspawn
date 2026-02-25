"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setSecurityWebHeaders = setSecurityWebHeaders;
var _debug = _interopRequireDefault(require("debug"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:middleware:web:security');
function setSecurityWebHeaders(_req, res, next) {
  // disable loading in frames (clickjacking, etc.)
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
  const framesOptions = res.getHeader(_core.HEADERS.FRAMES_OPTIONS);
  if (!framesOptions || !(framesOptions === 'deny' || framesOptions === 'sameorigin')) {
    debug('Missing or invalid X-Frame-Options header; setting to "deny"');
    res.header(_core.HEADERS.FRAMES_OPTIONS, 'deny');
  }

  // avoid establishing connections outside of domain
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
  if (!res.getHeader(_core.HEADERS.CSP)) {
    debug('Missing Content-Security-Policy header; setting to "connect-src \'self\'"');
    res.header(_core.HEADERS.CSP, "connect-src 'self'");
  }

  // respect the content type of the response
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options
  const cto = res.getHeader(_core.HEADERS.CTO);
  if (!cto || cto !== 'nosniff') {
    debug('Missing or invalid X-Content-Type-Options header; setting to "nosniff"');
    res.header(_core.HEADERS.CTO, 'nosniff');
  }

  // block rendering of the page in case of XSS attack
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-XSS-Protection
  const xss = res.getHeader(_core.HEADERS.XSS);
  if (!xss || !(xss === '0' || xss.startsWith('1'))) {
    debug('Missing or invalid X-XSS-Protection header; setting to "1; mode=block"');
    res.header(_core.HEADERS.XSS, '1; mode=block');
  }
  next();
}
//# sourceMappingURL=security.js.map