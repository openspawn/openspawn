"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ROLES = exports.PACKAGE_ACCESS = void 0;
exports.normalisePackageAccess = normalisePackageAccess;
exports.normalizeUserList = normalizeUserList;
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _nodeAssert = _interopRequireDefault(require("node:assert"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:config:utils');
// @deprecated use @verdaccio/core:authUtils
const ROLES = exports.ROLES = {
  $ALL: '$all',
  ALL: 'all',
  $AUTH: '$authenticated',
  $ANONYMOUS: '$anonymous',
  DEPRECATED_ALL: '@all',
  DEPRECATED_AUTH: '@authenticated',
  DEPRECATED_ANONYMOUS: '@anonymous'
};

// @deprecated use @verdaccio/core:authUtils
const PACKAGE_ACCESS = exports.PACKAGE_ACCESS = {
  SCOPE: '@*/*',
  ALL: '**'
};
function normalizeUserList(groupsList) {
  const result = [];
  if (_lodash.default.isNil(groupsList) || _lodash.default.isEmpty(groupsList)) {
    return result;
  }

  // if it's a string, split it to array
  if (_lodash.default.isString(groupsList)) {
    const groupsArray = groupsList.split(/\s+/);
    result.push(groupsArray);
  } else if (Array.isArray(groupsList)) {
    result.push(groupsList);
  } else {
    throw _core.errorUtils.getInternalError('CONFIG: bad package acl (array or string expected): ' + JSON.stringify(groupsList));
  }
  return _lodash.default.flatten(result);
}
function normalisePackageAccess(packages) {
  const normalizedPkgs = {
    ...packages
  };
  if (_lodash.default.isNil(normalizedPkgs['**'])) {
    normalizedPkgs['**'] = {
      access: [],
      publish: [],
      unpublish: [],
      proxy: []
    };
  }
  for (const pkg in packages) {
    if (Object.prototype.hasOwnProperty.call(packages, pkg)) {
      const packageAccess = packages[pkg];
      debug('package access %s for %s ', packageAccess, pkg);
      const isInvalid = _lodash.default.isObject(packageAccess) && _lodash.default.isArray(packageAccess) === false;
      (0, _nodeAssert.default)(isInvalid, `CONFIG: bad "'${pkg}'" package description (object expected)`);
      normalizedPkgs[pkg].access = normalizeUserList(packageAccess.access);
      normalizedPkgs[pkg].publish = normalizeUserList(packageAccess.publish);
      normalizedPkgs[pkg].proxy = normalizeUserList(packageAccess.proxy);
      // if unpublish is not defined, we set to false to fallback in publish access
      normalizedPkgs[pkg].unpublish = _lodash.default.isUndefined(packageAccess.unpublish) ? false : normalizeUserList(packageAccess.unpublish);
    }
  }
  return normalizedPkgs;
}
//# sourceMappingURL=package-access.js.map