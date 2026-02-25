"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMatchedPackagesSpec = getMatchedPackagesSpec;
var _minimatch = require("minimatch");
// @deprecated use @verdaccio/core:pkgUtils
function getMatchedPackagesSpec(pkgName, packages) {
  for (const i in packages) {
    if (_minimatch.minimatch.makeRe(i).exec(pkgName)) {
      return packages[i];
    }
  }
  return;
}
//# sourceMappingURL=matcher.js.map