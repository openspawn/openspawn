"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readFileNext = readFileNext;
var _lockfile = require("./lockfile");
var _utils = require("./utils");
async function lock(name, options) {
  if (!options.lock) {
    return null;
  }
  await (0, _lockfile.lockFileNext)(name);
}
async function read(name) {
  return (0, _utils.readFile)(name, 'utf8');
}
function parseJSON(contents, options) {
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
}

/**
 *  Reads a local file, which involves
 *  optionally taking a lock
 *  reading the file contents
 *  optionally parsing JSON contents
 * @param {*} name
 * @param {*} options
 * @param {*} callback
 */
async function readFileNext(name, options = {}) {
  const _options = {
    lock: options?.lock || false,
    parse: options?.parse || false
  };
  await lock(name, _options);
  const content = await read(name);
  const parsed = await parseJSON(content, options);
  return parsed;
}
//# sourceMappingURL=readFile.js.map