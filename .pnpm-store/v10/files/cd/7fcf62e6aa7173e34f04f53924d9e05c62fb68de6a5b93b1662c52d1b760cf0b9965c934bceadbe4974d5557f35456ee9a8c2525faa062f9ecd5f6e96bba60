"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readFile = readFile;
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _lockfile = require("./lockfile");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/* eslint-disable no-undef */

/**
 *  Reads a local file, which involves
 *  optionally taking a lock
 *  reading the file contents
 *  optionally parsing JSON contents
 * @param {*} name
 * @param {*} options
 * @param {*} callback
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
function readFile(name, options = {}, callback = () => {}) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options.lock = options.lock || false;
  options.parse = options.parse || false;
  const lock = function (options) {
    return new Promise((resolve, reject) => {
      if (!options.lock) {
        return resolve(null);
      }
      (0, _lockfile.lockFile)(name, function (err) {
        if (err) {
          return reject(err);
        }
        return resolve(null);
      });
    });
  };
  const read = function () {
    return new Promise((resolve, reject) => {
      _nodeFs.default.readFile(name, 'utf8', function (err, contents) {
        if (err) {
          return reject(err);
        }
        resolve(contents);
      });
    });
  };
  const parseJSON = function (contents) {
    return new Promise((resolve, reject) => {
      if (!options.parse) {
        return resolve(contents);
      }
      try {
        contents = JSON.parse(contents);
        return resolve(contents);
      } catch (err) {
        return reject(err);
      }
    });
  };
  Promise.resolve().then(() => lock(options)).then(() => read()).then(content => parseJSON(content)).then(result => callback(null, result), err => callback(err));
}
//# sourceMappingURL=readFile.js.map