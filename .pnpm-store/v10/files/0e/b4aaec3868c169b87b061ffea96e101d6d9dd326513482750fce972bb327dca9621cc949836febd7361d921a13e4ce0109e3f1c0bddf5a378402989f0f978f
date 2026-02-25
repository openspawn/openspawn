"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lockFileNext = lockFileNext;
var _utils = require("./utils");
/**
 * locks a file by creating a lock file
 * @param name
 * @param callback
 */
async function lockFileNext(name) {
  //  check if dir exist
  await (0, _utils.statDir)(name);
  // check if file exist
  await (0, _utils.statFile)(name);
  // lock fhe the file
  await (0, _utils.lockFileWithOptions)(name);
}
//# sourceMappingURL=lockfile.js.map