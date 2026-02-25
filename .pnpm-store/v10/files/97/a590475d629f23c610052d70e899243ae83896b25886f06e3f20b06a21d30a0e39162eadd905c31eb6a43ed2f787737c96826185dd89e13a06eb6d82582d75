"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromJStoYAML = fromJStoYAML;
exports.getConfigParsed = getConfigParsed;
exports.parseConfigFile = parseConfigFile;
var _debug = _interopRequireDefault(require("debug"));
var _jsYaml = _interopRequireDefault(require("js-yaml"));
var _lodash = require("lodash");
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _core = require("@verdaccio/core");
var _configPath = require("./config-path");
var _configUtils = require("./config-utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:config:parse');

/**
 * Parse a config file from yaml to JSON.
 * @param configPath the absolute path of the configuration file
 */
function parseConfigFile(configPath) {
  debug('parse config file %s', configPath);
  if (!(0, _configUtils.fileExists)(configPath)) {
    throw new Error(`config file does not exist or not reachable`);
  }
  debug('parsing config file: %o', configPath);
  try {
    if (/\.ya?ml$/i.test(configPath)) {
      const yamlConfig = _jsYaml.default.load(_nodeFs.default.readFileSync(configPath, 'utf8'), {
        strict: false
      });
      return Object.assign({}, yamlConfig, {
        configPath,
        // @deprecated use configPath instead
        config_path: configPath
      });
    }
    const jsonConfig = require(configPath);
    return Object.assign({}, jsonConfig, {
      configPath,
      // @deprecated use configPath instead
      config_path: configPath
    });
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      debug('config module not found %o error: %o', configPath, e.message);
      throw Error(_core.APP_ERROR.CONFIG_NOT_VALID);
    }
    throw e;
  }
}
function fromJStoYAML(config) {
  debug('convert config from JSON to YAML');
  if ((0, _lodash.isObject)(config)) {
    return _jsYaml.default.dump(config);
  } else {
    throw new Error(`config is not a valid object`);
  }
}

/**
 * Parses and returns a configuration object of type `ConfigYaml`.
 *
 * If a string or `undefined` is provided, it is interpreted as a path to a config file
 * (or uses a default location). The config file is then loaded and parsed.
 * If an object is provided, it is assumed to be a pre-parsed configuration.
 * Backward compability: ensures the returned configuration object has a `self_path` property set,
 * either to the config file path or to a property within the object.
 *
 * @param {string | ConfigYaml} [config] - Optional. A path to the configuration file (string),
 *                                         a pre-parsed config object, or `undefined`.
 * @returns {ConfigYaml} The parsed configuration object with a guaranteed `self_path` property.
 * @throws {Error} If the provided config is neither a string, undefined, nor an object.
 */
function getConfigParsed(config) {
  debug('getConfigParsed called with config: %o', typeof config);
  let configurationParsed;
  if (config === undefined || typeof config === 'string') {
    debug('using default configuration');
    const configPathLocation = (0, _configPath.findConfigFile)(config);
    configurationParsed = parseConfigFile(configPathLocation);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (!configurationParsed.self_path) {
      debug('self_path not defined, using config path location');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      configurationParsed.self_path = _nodePath.default.resolve(configPathLocation);
    }
  } else if (typeof config === 'object' && config !== null) {
    configurationParsed = config;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (!configurationParsed.self_path) {
      debug('self_path not defined, using config path location');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      configurationParsed.self_path = configurationParsed.configPath;
    }
  } else {
    throw new Error(_core.API_ERROR.CONFIG_BAD_FORMAT);
  }
  return configurationParsed;
}
//# sourceMappingURL=parse.js.map