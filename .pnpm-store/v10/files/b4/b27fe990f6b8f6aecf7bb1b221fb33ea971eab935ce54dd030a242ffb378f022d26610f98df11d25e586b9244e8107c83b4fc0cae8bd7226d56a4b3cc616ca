"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.media = media;
var _core = require("@verdaccio/core");
function media(expect) {
  return function (req, res, next) {
    const header = req.headers[_core.HEADER_TYPE.CONTENT_TYPE];
    if (!header) {
      next(_core.errorUtils.getCode(_core.HTTP_STATUS.UNSUPPORTED_MEDIA, 'content-type is missing, expect: ' + expect));
      return;
    }
    if (typeof header !== 'string' || header.split(';')[0].trim() !== expect) {
      next(_core.errorUtils.getCode(_core.HTTP_STATUS.UNSUPPORTED_MEDIA, 'wrong content-type, expect: ' + expect + ', got: ' + req.get[_core.HEADER_TYPE.CONTENT_TYPE]));
    } else {
      next();
    }
  };
}
//# sourceMappingURL=media.js.map