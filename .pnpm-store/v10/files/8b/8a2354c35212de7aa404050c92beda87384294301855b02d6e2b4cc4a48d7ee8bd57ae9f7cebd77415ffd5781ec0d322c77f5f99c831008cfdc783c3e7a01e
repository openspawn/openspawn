"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.match = match;
function match(regexp) {
  return function (req, res, next, value) {
    if (regexp.exec(value)) {
      next();
    } else {
      next('route');
    }
  };
}
//# sourceMappingURL=match.js.map