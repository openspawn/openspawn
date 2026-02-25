"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unlockFile = unlockFile;
var _lockfile = _interopRequireDefault(require("lockfile"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// unlocks file by removing existing lock file
function unlockFile(name, next) {
  const lockFileName = `${name}.lock`;
  _lockfile.default.unlock(lockFileName, function () {
    return next(null);
  });
}
//# sourceMappingURL=unclock.js.map