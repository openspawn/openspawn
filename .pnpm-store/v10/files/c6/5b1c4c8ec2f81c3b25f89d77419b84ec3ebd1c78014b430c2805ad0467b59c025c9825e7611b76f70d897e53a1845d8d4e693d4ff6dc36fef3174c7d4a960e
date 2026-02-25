"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasLogin = hasLogin;
exports.validatePrimaryColor = validatePrimaryColor;
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:web:middlwares');
function validatePrimaryColor(primaryColor) {
  const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(primaryColor);
  if (!isHex) {
    debug('invalid primary color %o', primaryColor);
    return;
  }
  return primaryColor;
}
function hasLogin(config) {
  return _lodash.default.isNil(config?.web?.login) || config?.web?.login === true;
}
//# sourceMappingURL=web-utils.js.map