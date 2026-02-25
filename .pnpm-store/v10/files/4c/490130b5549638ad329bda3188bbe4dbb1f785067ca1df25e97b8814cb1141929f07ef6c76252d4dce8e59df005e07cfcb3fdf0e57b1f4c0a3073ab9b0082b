"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expectJson = expectJson;
var _core = require("@verdaccio/core");
function expectJson(req, res, next) {
  if (!_core.validationUtils.isObject(req.body)) {
    return next(_core.errorUtils.getBadRequest("can't parse incoming json"));
  }
  next();
}
//# sourceMappingURL=json.js.map