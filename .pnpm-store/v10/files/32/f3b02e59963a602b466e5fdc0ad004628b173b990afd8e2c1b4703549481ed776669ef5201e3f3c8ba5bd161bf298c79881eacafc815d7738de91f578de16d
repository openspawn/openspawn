"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadPrivatePackages = loadPrivatePackages;
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _lodash = _interopRequireDefault(require("lodash"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function loadPrivatePackages(path, logger) {
  const list = [];
  const emptyDatabase = {
    list,
    secret: ''
  };
  const data = _nodeFs.default.readFileSync(path, 'utf8');
  if (_lodash.default.isNil(data)) {
    // readFileSync is platform specific, FreeBSD might return null
    return emptyDatabase;
  }
  let db;
  try {
    db = JSON.parse(data);
  } catch (err) {
    logger.error({
      err: err.mesage,
      path
    },
    // eslint-disable-next-line max-len
    `Package database file corrupted (invalid JSON), please check the error @{err}.\nFile Path: @{path}`);
    throw Error('Package database file corrupted (invalid JSON)');
  }
  if (_lodash.default.isEmpty(db)) {
    return emptyDatabase;
  }
  return db;
}
//# sourceMappingURL=pkg-utils.js.map