"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userAgent = userAgent;
var _config = require("@verdaccio/config");
var _core = require("@verdaccio/core");
function userAgent(config) {
  return function (_req, res, next) {
    res.setHeader(_core.HEADERS.POWERED_BY, (0, _config.getUserAgent)(config?.user_agent));
    next();
  };
}
//# sourceMappingURL=user-agent.js.map