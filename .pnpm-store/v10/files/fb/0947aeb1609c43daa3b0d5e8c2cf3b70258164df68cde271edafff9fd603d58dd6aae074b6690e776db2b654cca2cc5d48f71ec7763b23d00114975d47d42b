"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLatest = getLatest;
exports.mergeVersions = mergeVersions;
exports.semverSanitize = semverSanitize;
exports.semverSort = semverSort;
var _semver = _interopRequireDefault(require("semver"));
var _constants = require("./constants");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Function filters out bad semver versions and sorts the array.
 * @return {Array} sorted Array
 */
function semverSort(listVersions) {
  return listVersions.filter(function (x) {
    if (!_semver.default.parse(x, true)) {
      return false;
    }
    return true;
  }).sort(_semver.default.compareLoose).map(String);
}

/**
 * Sanitize a version string to a valid semver version.
 * @param version - The version string to sanitize.
 * @returns The sanitized version string.
 */
function semverSanitize(version) {
  return _semver.default.valid(version) || _semver.default.coerce(version, {
    includePrerelease: true
  })?.version || '';
}

/**
 * Get the latest publihsed version of a package.
 * @param package metadata
 **/
function getLatest(pkg) {
  const listVersions = Object.keys(pkg.versions);
  if (listVersions.length < 1) {
    throw Error('cannot get lastest version of none');
  }
  const versions = semverSort(listVersions);
  const latest = pkg[_constants.DIST_TAGS]?.latest ? pkg[_constants.DIST_TAGS].latest : versions[0];
  return latest;
}

/**
 * Function gets a local info and an info from uplinks and tries to merge it
 exported for unit tests only.
  * @param {*} local
  * @param {*} upstream
  * @param {*} config sds
  * @deprecated use @verdaccio/storage mergeVersions method
  */
// @deprecated
function mergeVersions(local, upstream) {
  // copy new versions to a cache
  // NOTE: if a certain version was updated, we can't refresh it reliably
  for (const i in upstream.versions) {
    if (typeof local.versions[i] === 'undefined') {
      local.versions[i] = upstream.versions[i];
    }
  }
  for (const i in upstream[_constants.DIST_TAGS]) {
    if (local[_constants.DIST_TAGS][i] !== upstream[_constants.DIST_TAGS][i]) {
      if (!local[_constants.DIST_TAGS][i] || _semver.default.lte(local[_constants.DIST_TAGS][i], upstream[_constants.DIST_TAGS][i])) {
        local[_constants.DIST_TAGS][i] = upstream[_constants.DIST_TAGS][i];
      }
      if (i === 'latest' && local[_constants.DIST_TAGS][i] === upstream[_constants.DIST_TAGS][i]) {
        // if remote has more fresh package, we should borrow its readme
        local.readme = upstream.readme;
      }
    }
  }
}
//# sourceMappingURL=pkg-utils.js.map