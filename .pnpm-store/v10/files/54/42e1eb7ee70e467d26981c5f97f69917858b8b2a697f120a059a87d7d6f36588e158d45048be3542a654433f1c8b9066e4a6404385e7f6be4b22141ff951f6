"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logger = void 0;
exports.setup = setup;
var _pino = _interopRequireDefault(require("pino"));
var _loggerCommons = require("@verdaccio/logger-commons");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function setup(options) {
  if (typeof logger !== 'undefined') {
    return logger;
  }
  exports.logger = logger = (0, _loggerCommons.prepareSetup)(options, _pino.default);
  return logger;
}
let logger = exports.logger = void 0;
//# sourceMappingURL=index.js.map