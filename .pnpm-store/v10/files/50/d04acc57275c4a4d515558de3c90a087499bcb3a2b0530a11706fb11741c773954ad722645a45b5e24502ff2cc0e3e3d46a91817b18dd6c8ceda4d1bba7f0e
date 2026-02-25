"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateName = validateName;
exports.validatePackage = validatePackage;
var _core = require("@verdaccio/core");
function validateName(_req, _res, next, value, name) {
  if (_core.validationUtils.validateName(value)) {
    next();
  } else {
    next(_core.errorUtils.getBadRequest('invalid ' + name));
  }
}
function validatePackage(_req, _res, next, value, name) {
  if (_core.validationUtils.validatePackage(value)) {
    next();
  } else {
    next(_core.errorUtils.getBadRequest('invalid ' + name));
  }
}
//# sourceMappingURL=validation.js.map