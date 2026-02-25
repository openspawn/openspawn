"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAnonymousRemoteUser = createAnonymousRemoteUser;
exports.createRemoteUser = createRemoteUser;
exports.defaultNonLoggedUserRoles = exports.defaultLoggedUserRoles = void 0;
var _packageAccess = require("./package-access");
/**
 * All logged users will have by default the group $all and $authenticate
 */
const defaultLoggedUserRoles = exports.defaultLoggedUserRoles = [_packageAccess.ROLES.$ALL, _packageAccess.ROLES.$AUTH, _packageAccess.ROLES.DEPRECATED_ALL, _packageAccess.ROLES.DEPRECATED_AUTH, _packageAccess.ROLES.ALL];
/**
 *
 */
const defaultNonLoggedUserRoles = exports.defaultNonLoggedUserRoles = [_packageAccess.ROLES.$ALL, _packageAccess.ROLES.$ANONYMOUS,
// groups without '$' are going to be deprecated eventually
_packageAccess.ROLES.DEPRECATED_ALL, _packageAccess.ROLES.DEPRECATED_ANONYMOUS];

/**
 * Create a RemoteUser object
 * @return {Object} \{ name: xx, pluginGroups: [], real_groups: [] \}
 */
function createRemoteUser(name, pluginGroups) {
  const isGroupValid = Array.isArray(pluginGroups);
  const groups = Array.from(new Set((isGroupValid ? pluginGroups : []).concat([...defaultLoggedUserRoles])));
  return {
    name,
    groups,
    real_groups: pluginGroups
  };
}

/**
 * Builds an anonymous remote user in case none is logged in.
 * @return {Object} \{ name: xx, groups: [], real_groups: [] \}
 */
function createAnonymousRemoteUser() {
  return {
    name: undefined,
    groups: [...defaultNonLoggedUserRoles],
    real_groups: []
  };
}
//# sourceMappingURL=user.js.map