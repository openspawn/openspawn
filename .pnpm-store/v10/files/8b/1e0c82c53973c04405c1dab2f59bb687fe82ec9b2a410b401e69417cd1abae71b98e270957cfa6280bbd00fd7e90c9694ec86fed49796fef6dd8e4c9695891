"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _express = _interopRequireDefault(require("express"));
var _renderWeb = require("./render-web");
var _webApi = require("./web-api");
var _webUrls = require("./web-urls");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var _default = (config, middlewares, pluginOptions) => {
  // eslint-disable-next-line new-cap
  const router = _express.default.Router();
  const {
    tokenMiddleware,
    webEndpointsApi
  } = middlewares;
  // render web
  router.use(_webUrls.WebUrlsNamespace.root, (0, _renderWeb.renderWebMiddleware)(config, tokenMiddleware, pluginOptions));
  // web endpoints: search, packages, readme, sidebar, etc
  router.use(_webUrls.WebUrlsNamespace.endpoints, (0, _webApi.webAPIMiddleware)(tokenMiddleware, webEndpointsApi));
  return router;
};
exports.default = _default;
//# sourceMappingURL=web-middleware.js.map