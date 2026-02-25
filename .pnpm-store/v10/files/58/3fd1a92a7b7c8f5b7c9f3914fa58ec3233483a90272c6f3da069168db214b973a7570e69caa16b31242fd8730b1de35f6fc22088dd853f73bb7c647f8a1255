"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encodeScopePackage = encodeScopePackage;
var _debug = _interopRequireDefault(require("debug"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:middleware:encode');

/**
 * Encode / in a scoped package name to be matched as a single parameter in routes
 * @param req
 * @param res
 * @param next
 */
function encodeScopePackage(req, res, next) {
  const original = req.url;

  // Expect relative URLs i.e. should call makeURLrelative before this middleware
  if (!req.url.startsWith('/')) {
    return next(_core.errorUtils.getBadRequest(`Invalid URL: ${req.url} (must be relative)`));
  }

  // If the @ sign is encoded, we need to decode it first
  // e.g.: /%40org/pkg/1.2.3 -> /@org/pkg/1.2.3
  // For scoped packages, encode the slash to make it a single path segment/parameter
  // e.g.: /@org/pkg/1.2.3 -> /@org%2Fpkg/1.2.3, /@org%2Fpkg/1.2.3 -> /@org%2Fpkg/1.2.3
  // also handle cases for dist-tags where package is in the middle of the path and not at the beginning
  // e.g.: /-/package/@org/pkg/dist-tags/latest -> /-/package/@org%2Fpkg/dist-tags/latest
  req.url = req.url.replace(/\/%40/, '/@').replace(/(\/@[^\/%]+)\/(?!$)/, '$1%2F');
  if (original !== req.url) {
    debug('encodeScopePackage: %o -> %o', original, req.url);
  } else {
    debug('encodeScopePackage: %o (unchanged)', original);
  }
  next();
}
//# sourceMappingURL=encode-pkg.js.map