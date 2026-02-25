"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_UPLINK = exports.DEFAULT_REGISTRY = void 0;
exports.getProxiesForPackage = getProxiesForPackage;
exports.hasProxyTo = hasProxyTo;
exports.sanityCheckNames = sanityCheckNames;
exports.sanityCheckUplinksProps = sanityCheckUplinksProps;
exports.uplinkSanityCheck = uplinkSanityCheck;
var _lodash = _interopRequireDefault(require("lodash"));
var _nodeAssert = _interopRequireDefault(require("node:assert"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const DEFAULT_REGISTRY = exports.DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const DEFAULT_UPLINK = exports.DEFAULT_UPLINK = 'npmjs';
const BLACKLIST = {
  all: true,
  anonymous: true,
  undefined: true,
  owner: true,
  none: true
};
function uplinkSanityCheck(uplinks, users = BLACKLIST) {
  const newUplinks = _lodash.default.clone(uplinks);
  let newUsers = _lodash.default.clone(users);
  for (const uplink in newUplinks) {
    if (Object.prototype.hasOwnProperty.call(newUplinks, uplink)) {
      if (typeof newUplinks[uplink].cache === 'undefined') {
        newUplinks[uplink].cache = true;
      }
      newUsers = sanityCheckNames(uplink, newUsers);
    }
  }
  return newUplinks;
}
function sanityCheckUplinksProps(configUpLinks) {
  const uplinks = _lodash.default.clone(configUpLinks);
  for (const uplink in uplinks) {
    if (Object.prototype.hasOwnProperty.call(uplinks, uplink)) {
      (0, _nodeAssert.default)(uplinks[uplink].url, 'CONFIG: no url for uplink: ' + uplink);
      (0, _nodeAssert.default)(_lodash.default.isString(uplinks[uplink].url), 'CONFIG: wrong url format for uplink: ' + uplink);
      uplinks[uplink].url = uplinks[uplink].url.replace(/\/$/, '');
    }
  }
  return uplinks;
}
function getProxiesForPackage(pkg, packages) {
  const matchedPkg = _core.authUtils.getMatchedPackagesSpec(pkg, packages);
  return matchedPkg?.proxy || [];
}
function hasProxyTo(pkg, upLink, packages) {
  const proxyList = getProxiesForPackage(pkg, packages);
  if (proxyList) {
    return proxyList.some(curr => upLink === curr);
  }
  return false;
}
function sanityCheckNames(item, users) {
  (0, _nodeAssert.default)(item !== 'all' && item !== 'owner' && item !== 'anonymous' && item !== 'undefined' && item !== 'none', 'CONFIG: reserved uplink name: ' + item);
  (0, _nodeAssert.default)(!item.match(/\s/), 'CONFIG: invalid uplink name: ' + item);
  (0, _nodeAssert.default)(_lodash.default.isNil(users[item]), 'CONFIG: duplicate uplink name: ' + item);
  users[item] = true;
  return users;
}
//# sourceMappingURL=uplinks.js.map