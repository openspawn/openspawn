"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fileExists = fileExists;
exports.folderExists = folderExists;
var _debug = _interopRequireDefault(require("debug"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:config:config-utils');

/**
 * Check whether the path already exist.
 * @param {String} path
 * @return {Boolean}
 */
function folderExists(path) {
  try {
    debug('check folder exist', path);
    const stat = _nodeFs.default.statSync(path);
    const isDirectory = stat.isDirectory();
    debug('folder exist', isDirectory);
    return isDirectory;
  } catch (_) {
    debug('folder %s does not exist', path);
    return false;
  }
}

/**
 * Check whether the file already exist.
 * @param {String} path
 * @return {Boolean}
 */
function fileExists(path) {
  try {
    debug('check file exist', path);
    const stat = _nodeFs.default.statSync(path);
    const isFile = stat.isFile();
    debug('file exist', isFile);
    return isFile;
  } catch (_) {
    debug('file %s does not exist', path);
    return false;
  }
}
//# sourceMappingURL=config-utils.js.map