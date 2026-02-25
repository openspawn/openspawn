"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findConfigFile = findConfigFile;
exports.readDefaultConfig = readDefaultConfig;
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodeOs = _interopRequireDefault(require("node:os"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _configUtils = require("./config-utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const CONFIG_FILE = 'config.yaml';
const XDG = 'xdg';
// eslint-disable-next-line
const pkgJSON = {
  name: 'verdaccio'
};
const debug = (0, _debug.default)('verdaccio:config:config-path');

/**
 * Find and get the first config file that match.
 * @return {String} the config file path
 */
function findConfigFile(configPath) {
  debug('searching for config file %o', configPath);
  if (typeof configPath !== 'undefined') {
    const configLocation = _nodePath.default.resolve(configPath);
    debug('custom location %s', configLocation);
    return configLocation;
  }
  const configPaths = getConfigPaths();
  debug('%o posible locations found', configPaths.length);
  if (configPaths.length === 0) {
    debug('no configuration files can be processed');
    // this should never happens
    throw new Error('no configuration files can be processed');
  }

  // find the first location that already exist
  const primaryConf = _lodash.default.find(configPaths, configLocation => (0, _configUtils.fileExists)(configLocation.path));
  if (typeof primaryConf !== 'undefined') {
    debug('at least one primary location detected at %s', primaryConf?.path);
    return primaryConf.path;
  }
  debug('no previous location found, creating a new one');
  debug('generating the first match path location  %s', configPaths[0].path);
  return createConfigFile(configPaths[0]).path;
}
function createConfigFile(configLocation) {
  createConfigFolder(configLocation);
  const defaultConfig = updateStorageLinks(configLocation, readDefaultConfig());
  _nodeFs.default.writeFileSync(configLocation.path, defaultConfig);
  return configLocation;
}
function readDefaultConfig() {
  const pathDefaultConf = _nodePath.default.resolve(__dirname, 'conf/default.yaml');
  try {
    debug('the path of default config used from %s', pathDefaultConf);
    _nodeFs.default.accessSync(pathDefaultConf, _nodeFs.default.constants.R_OK);
    debug('configuration file has enough permissions for reading');
  } catch {
    debug('configuration file does not have enough permissions for reading');
    throw new TypeError('configuration file does not have enough permissions for reading');
  }
  return _nodeFs.default.readFileSync(pathDefaultConf, 'utf8');
}
function createConfigFolder(configLocation) {
  const folder = _nodePath.default.dirname(configLocation.path);
  debug(`creating default config file folder at %o`, folder);
  _nodeFs.default.mkdirSync(folder, {
    recursive: true
  });
  debug(`folder %o created`, folder);
}

/**
 * Update the storage links to the new location if it is necessary.
 * @param configLocation
 * @param defaultConfig
 * @returns
 */
function updateStorageLinks(configLocation, defaultConfig) {
  debug('checking storage links for %s and type %s', configLocation.path, configLocation.type);
  if (configLocation.type !== XDG) {
    debug(`skip storage override for %s`, configLocation.type);
    return defaultConfig;
  }

  // $XDG_DATA_HOME defines the base directory relative to which user specific data
  // files should be stored, If $XDG_DATA_HOME is either not set or empty, a default
  // equal to $HOME/.local/share should be used.
  let dataDir = process.env.XDG_DATA_HOME || _nodePath.default.join(process.env.HOME, '.local', 'share');
  if ((0, _configUtils.folderExists)(dataDir)) {
    debug(`previous storage located`);
    debug(`update storage links to %s`, dataDir);
    dataDir = _nodePath.default.resolve(_nodePath.default.join(dataDir, pkgJSON.name, 'storage'));
    return defaultConfig.replace(/^storage: .\/storage$/m, `storage: ${dataDir}`);
  }
  debug(`could not find a previous storage location, skip override`);
  return defaultConfig;
}

/**
 * Return a list of configuration locations by platform.
 * @returns
 */
function getConfigPaths() {
  const listPaths = [getXDGDirectory(), getWindowsDirectory(), getRelativeDefaultDirectory(), getOldDirectory()];
  return listPaths.reduce(function (acc, currentValue) {
    if (typeof currentValue !== 'undefined') {
      debug('posible directory path generated %s for type %s', currentValue?.path, currentValue.type);
      acc.push(currentValue);
    }
    return acc;
  }, []);
}

/**
 * Get XDG_CONFIG_HOME or HOME location (usually unix)
 *
 * The XDG_CONFIG_HOME environment variable is also part of the XDG Base Directory Specification,
 * which aims to standardize the locations where applications store configuration files and other
 * user-specific data on Unix-like operating systems.
 *
 *
 *
 * https://specifications.freedesktop.org/basedir-spec/latest/
 *
 *
 * @returns
 */
const getXDGDirectory = () => {
  const xDGConfigPath = process.env.XDG_CONFIG_HOME || process.env.HOME && _nodePath.default.join(process.env.HOME, '.config');
  debug('XDGConfig folder path %s', xDGConfigPath);
  if (xDGConfigPath && (0, _configUtils.folderExists)(xDGConfigPath)) {
    debug('XDGConfig folder path %s', xDGConfigPath);
    return {
      path: _nodePath.default.join(xDGConfigPath, pkgJSON.name, CONFIG_FILE),
      type: XDG
    };
  }
};

/**
 * Detect windows location, APPDATA
 * usually something like C:\User\<Build User>\AppData\Local
 * @returns
 */
const getWindowsDirectory = () => {
  if (_nodeOs.default.platform() === 'win32' && process.env.APPDATA && (0, _configUtils.folderExists)(process.env.APPDATA)) {
    debug('windows appdata folder path %s', process.env.APPDATA);
    return {
      path: _nodePath.default.resolve(_nodePath.default.join(process.env.APPDATA, pkgJSON.name, CONFIG_FILE)),
      type: 'win'
    };
  }
};

/**
 * Return relative directory, this is the default.
 * It will cretate config in your {currentLocation/verdaccio/config.yaml}
 * @returns
 */
const getRelativeDefaultDirectory = () => {
  const relativePath = _nodePath.default.resolve(_nodePath.default.join('.', pkgJSON.name, CONFIG_FILE));
  debug('relative folder path %s', relativePath);
  return {
    path: relativePath,
    type: 'def'
  };
};

/**
 * This should never happens, consider it DEPRECATED
 * @returns
 */
const getOldDirectory = () => {
  const oldPath = _nodePath.default.resolve(_nodePath.default.join('.', CONFIG_FILE));
  debug('old folder path %s', oldPath);
  return {
    path: oldPath,
    type: 'old'
  };
};
//# sourceMappingURL=config-path.js.map