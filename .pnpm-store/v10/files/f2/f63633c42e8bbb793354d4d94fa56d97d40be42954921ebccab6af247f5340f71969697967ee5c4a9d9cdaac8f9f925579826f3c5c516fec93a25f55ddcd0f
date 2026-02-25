"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLocalRegistryTarballUri = getLocalRegistryTarballUri;
var _debug = _interopRequireDefault(require("debug"));
var _core = require("@verdaccio/core");
var _url = require("@verdaccio/url");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:core:tarball');

/**
 * Filter a tarball url.
 * @param {*} uri
 * @return {String} a parsed url
 */
function getLocalRegistryTarballUri(uri, pkgName, requestOptions, urlPrefix) {
  const currentHost = requestOptions?.headers?.host;
  if (!currentHost) {
    return uri;
  }
  const tarballName = _core.tarballUtils.extractTarballFromUrl(uri);
  debug('tarball name %o', tarballName);
  // header only set with proxy that setup with HTTPS
  const domainRegistry = (0, _url.getPublicUrl)(urlPrefix || '', requestOptions);
  return `${domainRegistry}${pkgName}/-/${tarballName}`;
}
//# sourceMappingURL=getLocalRegistryTarballUri.js.map