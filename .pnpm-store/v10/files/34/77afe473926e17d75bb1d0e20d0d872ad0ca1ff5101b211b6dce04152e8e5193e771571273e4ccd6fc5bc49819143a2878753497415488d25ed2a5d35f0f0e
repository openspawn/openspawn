"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildToken = buildToken;
exports.buildUserBuffer = buildUserBuffer;
exports.createSessionToken = createSessionToken;
exports.getAuthenticatedMessage = getAuthenticatedMessage;
exports.getMatchedPackagesSpec = getMatchedPackagesSpec;
var _minimatch = require("minimatch");
function createSessionToken() {
  const tenHoursTime = 10 * 60 * 60 * 1000;
  return {
    // npmjs.org sets 10h expire
    expires: new Date(Date.now() + tenHoursTime)
  };
}
function getAuthenticatedMessage(user) {
  return `you are authenticated as '${user}'`;
}
function buildUserBuffer(name, password) {
  return Buffer.from(`${name}:${password}`, 'utf8');
}
function buildToken(type, token) {
  return `${capitalize(type)} ${token}`;
}
function getMatchedPackagesSpec(pkgName, packages) {
  for (const i in packages) {
    if (_minimatch.minimatch.makeRe(i).exec(pkgName)) {
      return packages[i];
    }
  }
  return;
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
//# sourceMappingURL=auth-utils.js.map