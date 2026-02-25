"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findPackages = findPackages;
exports.getFileStats = getFileStats;
exports.readDirectory = readDirectory;
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _lodash = _interopRequireDefault(require("lodash"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function getFileStats(packagePath) {
  return new Promise((resolve, reject) => {
    _nodeFs.default.stat(packagePath, (err, stats) => {
      if (_lodash.default.isNil(err) === false) {
        return reject(err);
      }
      resolve(stats);
    });
  });
}
function readDirectory(packagePath) {
  return new Promise((resolve, reject) => {
    _nodeFs.default.readdir(packagePath, (err, scopedPackages) => {
      if (_lodash.default.isNil(err) === false) {
        return reject(err);
      }
      resolve(scopedPackages);
    });
  });
}
function hasScope(file) {
  return file.match(/^@/) !== null;
}

/* eslint-disable no-async-promise-executor */
async function findPackages(storagePath, validationHandler) {
  const listPackages = [];
  return new Promise(async (resolve, reject) => {
    try {
      const scopePath = _nodePath.default.resolve(storagePath);
      const storageDirs = await readDirectory(scopePath);
      for (const directory of storageDirs) {
        // we check whether has 2nd level
        if (hasScope(directory)) {
          // we read directory multiple
          const scopeDirectory = _nodePath.default.resolve(storagePath, directory);
          const scopedPackages = await readDirectory(scopeDirectory);
          for (const scopedDirName of scopedPackages) {
            if (validationHandler(scopedDirName)) {
              // we build the complete scope path
              const scopePath = _nodePath.default.resolve(storagePath, directory, scopedDirName);
              // list content of such directory
              listPackages.push({
                name: `${directory}/${scopedDirName}`,
                path: scopePath
              });
            }
          }
        } else {
          // otherwise we read as single level
          if (validationHandler(directory)) {
            const scopePath = _nodePath.default.resolve(storagePath, directory);
            listPackages.push({
              name: directory,
              path: scopePath
            });
          }
        }
      }
    } catch (error) {
      reject(error);
    }
    resolve(listPackages);
  });
}
/* eslint-enable no-async-promise-executor */
//# sourceMappingURL=utils.js.map