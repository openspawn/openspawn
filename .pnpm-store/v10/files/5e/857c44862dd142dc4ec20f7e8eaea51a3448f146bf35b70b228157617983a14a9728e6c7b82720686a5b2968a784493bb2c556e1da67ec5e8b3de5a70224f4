"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Files = void 0;
exports.createTempFolder = createTempFolder;
exports.createTempStorageFolder = createTempStorageFolder;
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodeOs = _interopRequireDefault(require("node:os"));
var _nodePath = _interopRequireDefault(require("node:path"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const Files = exports.Files = {
  DatabaseName: '.verdaccio-db.json'
};
const {
  mkdir,
  mkdtemp
} = _nodeFs.default.promises ? _nodeFs.default.promises : require('fs/promises');

/**
 * Create a temporary folder.
 * @param prefix The prefix of the folder name.
 * @returns string
 */
async function createTempFolder(prefix) {
  return await mkdtemp(_nodePath.default.join(_nodeOs.default.tmpdir(), 'verdaccio-' + prefix + '-'));
}

/**
 * Create temporary folder for an asset.
 * @param prefix
 * @param folder name
 * @returns
 */
async function createTempStorageFolder(prefix, folder = 'storage') {
  const tempFolder = await createTempFolder(prefix);
  const storageFolder = _nodePath.default.join(tempFolder, folder);
  await mkdir(storageFolder);
  return storageFolder;
}
//# sourceMappingURL=file-utils.js.map