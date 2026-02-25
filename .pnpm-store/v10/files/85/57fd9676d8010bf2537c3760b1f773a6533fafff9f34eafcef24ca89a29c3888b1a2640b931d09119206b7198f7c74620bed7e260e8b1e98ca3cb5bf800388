"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getManifestValue = getManifestValue;
var _debug = _interopRequireDefault(require("debug"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:middleware:web:render:manifest');
function getManifestValue(manifestItems, manifest, basePath = '') {
  return manifestItems?.map(item => {
    debug('resolve item %o', item);
    const resolvedItem = `${stripTrailingSlash(basePath)}/${stripLeadingSlash(manifest[item])}`;
    debug('resolved item %o', resolvedItem);
    return resolvedItem;
  });
}
function stripTrailingSlash(path) {
  return path.replace(/\/$/, '');
}
function stripLeadingSlash(path) {
  return path.replace(/^\//, '');
}
//# sourceMappingURL=manifest.js.map