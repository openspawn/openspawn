"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isES6 = isES6;
exports.isValid = isValid;
exports.tryLoad = tryLoad;
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:plugin:loader:utils');
const MODULE_NOT_FOUND = 'MODULE_NOT_FOUND';
function isValid(plugin) {
  // @ts-expect-error default not relevant
  return _lodash.default.isFunction(plugin) || _lodash.default.isFunction(plugin.default);
}
function isES6(plugin) {
  return Object.keys(plugin).includes('default');
}

/**
 * Requires a module.
 * @param {*} path the module's path
 * @return {Object}
 */
function tryLoad(path, onError) {
  try {
    debug('loading plugin %s', path);
    return require(path);
  } catch (err) {
    if (err.code === MODULE_NOT_FOUND) {
      debug('"require" failed for plugin %s', path);
      // If loading fails, because a dependency is missing,
      // we want to log the error message and require stack
      // to see where the missing dependency is.
      const message = err.message.replace(/\\\\/g, '\\').split('\n');
      if (!message[0].includes(path)) {
        debug('%o', message[0]); // error message
        debug('%o', message.slice(1)); // stack trace
      }
      return null;
    }
    onError({
      err: err.msg
    }, 'error loading plugin @{err}');
    throw err;
  }
}
//# sourceMappingURL=utils.js.map