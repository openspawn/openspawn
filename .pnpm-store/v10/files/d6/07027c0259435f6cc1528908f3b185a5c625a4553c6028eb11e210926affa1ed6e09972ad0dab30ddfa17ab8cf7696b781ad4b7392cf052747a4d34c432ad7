"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webAPIMiddleware = webAPIMiddleware;
var _express = _interopRequireWildcard(require("express"));
var _validation = require("../validation");
var _security = require("./security");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function webAPIMiddleware(tokenMiddleware, webEndpointsApi) {
  // eslint-disable-next-line new-cap
  const route = (0, _express.Router)();
  // validate all of these params as a package name
  // this might be too harsh, so ask if it causes trouble=
  route.param('package', _validation.validatePackage);
  route.param('filename', _validation.validateName);
  route.param('version', _validation.validateName);
  route.use(_express.default.urlencoded({
    extended: false
  }));
  route.use(_security.setSecurityWebHeaders);
  if (typeof tokenMiddleware === 'function') {
    route.use(tokenMiddleware);
  }
  if (typeof webEndpointsApi === 'function') {
    route.use(webEndpointsApi);
  }
  return route;
}
//# sourceMappingURL=web-api.js.map