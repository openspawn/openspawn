"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ROLES = exports.PACKAGE_ACCESS = void 0;
exports.buildUserBuffer = buildUserBuffer;
exports.createSessionToken = createSessionToken;
exports.getAuthenticatedMessage = getAuthenticatedMessage;
function createSessionToken() {
  const tenHoursTime = 10 * 60 * 60 * 1000;
  return {
    // npmjs.org sets 10h expire
    expires: new Date(Date.now() + tenHoursTime)
  };
}

// @deprecated use @verdaccio/core
function getAuthenticatedMessage(user) {
  return `you are authenticated as '${user}'`;
}

// @deprecated use @verdaccio/core
function buildUserBuffer(name, password) {
  return Buffer.from(`${name}:${password}`, 'utf8');
}

// @deprecated use @verdaccio/core
const ROLES = exports.ROLES = {
  $ALL: '$all',
  ALL: 'all',
  $AUTH: '$authenticated',
  $ANONYMOUS: '$anonymous',
  DEPRECATED_ALL: '@all',
  DEPRECATED_AUTH: '@authenticated',
  DEPRECATED_ANONYMOUS: '@anonymous'
};

// @deprecated use @verdaccio/core
const PACKAGE_ACCESS = exports.PACKAGE_ACCESS = {
  SCOPE: '@*/*',
  ALL: '**'
};
//# sourceMappingURL=auth-utils.js.map