"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertDistRemoteToLocalTarballUrls = convertDistRemoteToLocalTarballUrls;
exports.convertDistVersionToLocalTarballsUrl = convertDistVersionToLocalTarballsUrl;
var _getLocalRegistryTarballUri = require("./getLocalRegistryTarballUri");
/**
 * Iterate a packages's versions and filter each original tarball url.
 * @param {*} pkg
 * @param {*} request
 * @param {*} urlPrefix
 * @return {String} a filtered package
 */
function convertDistRemoteToLocalTarballUrls(pkg, request, urlPrefix) {
  const {
    name,
    versions
  } = pkg;
  const convertedPkg = {
    ...pkg
  };
  const convertedVersions = versions;
  for (const ver in pkg.versions) {
    if (Object.prototype.hasOwnProperty.call(pkg.versions, ver)) {
      const version = versions[ver];
      convertedVersions[ver] = convertDistVersionToLocalTarballsUrl(name, version, request, urlPrefix);
    }
  }
  return {
    ...convertedPkg,
    versions: convertedVersions
  };
}

/**
 * Convert single Version disst tarball
 * @param name
 * @param version
 * @param request
 * @param urlPrefix
 * @returns
 */
function convertDistVersionToLocalTarballsUrl(name, version, request, urlPrefix) {
  const distName = version.dist;
  if (distName && distName.tarball) {
    return {
      ...version,
      dist: {
        ...distName,
        tarball: (0, _getLocalRegistryTarballUri.getLocalRegistryTarballUri)(distName.tarball, name, request, urlPrefix)
      }
    };
  }
  return version;
}
//# sourceMappingURL=convertDistRemoteToLocalTarballUrls.js.map