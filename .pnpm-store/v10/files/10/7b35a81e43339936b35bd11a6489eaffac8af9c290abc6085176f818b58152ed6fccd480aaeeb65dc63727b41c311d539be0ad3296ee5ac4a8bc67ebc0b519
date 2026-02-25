"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getUserAgent = getUserAgent;
var _lodash = _interopRequireDefault(require("lodash"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function getUserAgent(customUserAgent, version, name) {
  if (customUserAgent === true) {
    return `${name}/${version}`;
  } else if (_lodash.default.isString(customUserAgent) && _lodash.default.isEmpty(customUserAgent) === false) {
    return customUserAgent;
  } else if (customUserAgent === false) {
    return 'hidden';
  }
  return `${name}/${version}`;
}
//# sourceMappingURL=agent.js.map