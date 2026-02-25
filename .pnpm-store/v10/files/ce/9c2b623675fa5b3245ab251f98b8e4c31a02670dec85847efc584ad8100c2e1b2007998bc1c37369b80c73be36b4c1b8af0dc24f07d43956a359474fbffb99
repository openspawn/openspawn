"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeURLrelative = makeURLrelative;
var _debug = _interopRequireDefault(require("debug"));
var _nodeUrl = require("node:url");
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:middleware:make-url-relative');

/**
 * Removes the host from the URL and turns it into a relative URL.
 * @param req
 * @param res
 * @param next
 */
function makeURLrelative(req, res, next) {
  const original = req.url;

  // npm requests can contain the full URL, including the hostname, for example:
  // tarball downloads. Removing the hostname makes the URL relative and allows
  // the application to handle requests in a more consistent way.

  let url;
  try {
    // In productive use, the URL is absolute (and base will be ignored)
    // In tests, the URL might brelative (and base will be used)
    // https://nodejs.org/docs/latest/api/url.html#new-urlinput-base
    url = new _nodeUrl.URL(req.url, `${req.protocol}://${req.headers.host}/`);
  } catch (error) {
    return next(_core.errorUtils.getBadRequest(`Invalid URL: ${req.url} (${error})`));
  }

  // Rebuild the URL without hostname
  req.url = url.pathname + url.search + url.hash;
  if (original !== req.url) {
    debug('makeURLrelative: %o -> %o', original, req.url);
  } else {
    debug('makeURLrelative: %o (unchanged)', original);
  }
  next();
}
//# sourceMappingURL=make-url-relative.js.map