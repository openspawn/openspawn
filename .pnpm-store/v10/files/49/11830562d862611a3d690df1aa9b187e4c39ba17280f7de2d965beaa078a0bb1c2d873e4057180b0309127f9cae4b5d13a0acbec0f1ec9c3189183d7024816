"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderWebMiddleware = renderWebMiddleware;
var _debug = _interopRequireDefault(require("debug"));
var _express = _interopRequireDefault(require("express"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _core = require("@verdaccio/core");
var _url = require("@verdaccio/url");
var _security = require("./security");
var _renderHTML = _interopRequireDefault(require("./utils/renderHTML"));
var _webUrls = require("./web-urls");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:web:render');
const sendFileCallback = next => err => {
  if (!err) {
    return;
  }
  if (err.status === _core.HTTP_STATUS.NOT_FOUND) {
    next();
  } else {
    next(err);
  }
};
function renderWebMiddleware(config, tokenMiddleware, pluginOptions) {
  const {
    staticPath,
    manifest,
    manifestFiles
  } = pluginOptions;
  debug('static path %o', staticPath);

  /* eslint new-cap:off */
  const router = _express.default.Router();
  if (typeof tokenMiddleware === 'function') {
    router.use(tokenMiddleware);
  }
  router.use(_security.setSecurityWebHeaders);

  // any match within the static is routed to the file system
  router.get(_webUrls.WebUrlsNamespace.static + '*', function (req, res, next) {
    const filename = req.params[0];
    let file = `${staticPath}/${filename}`;
    if (filename === 'favicon.ico' && config?.web?.favicon) {
      file = config?.web?.favicon;
      if ((0, _url.isURLhasValidProtocol)(file)) {
        debug('redirect to favicon %s', file);
        req.url = file;
        return next();
      }
    }
    debug('render static file %o', file);
    res.sendFile(file, sendFileCallback(next));
  });
  function renderLogo(logo) {
    // check the origin of the logo
    if (logo && !(0, _url.isURLhasValidProtocol)(logo)) {
      // URI related to a local file
      const absoluteLocalFile = _nodePath.default.posix.resolve(logo);
      debug('serve local logo %s', absoluteLocalFile);
      try {
        // TODO: replace existsSync by async alternative
        if (_nodeFs.default.existsSync(absoluteLocalFile) && typeof _nodeFs.default.accessSync(absoluteLocalFile, _nodeFs.default.constants.R_OK) === 'undefined') {
          // Note: `path.join` will break on Windows, because it transforms `/` to `\`
          // Use POSIX version `path.posix.join` instead.
          logo = _nodePath.default.posix.join(_webUrls.WebUrlsNamespace.static, _nodePath.default.basename(logo));
          router.get(logo, function (_req, res, next) {
            // @ts-ignore
            debug('serve custom logo  web:%s - local:%s', logo, absoluteLocalFile);
            res.sendFile(absoluteLocalFile, sendFileCallback(next));
          });
          debug('enabled custom logo %s', logo);
        } else {
          logo = undefined;
          debug(`web logo is wrong, path ${absoluteLocalFile} does not exist or is not readable`);
        }
      } catch {
        logo = undefined;
        debug(`web logo is wrong, path ${absoluteLocalFile} does not exist or is not readable`);
      }
    }
    return logo;
  }
  const logo = renderLogo(config?.web?.logo);
  if (config?.web?.logo) {
    config.web.logo = logo;
  }
  const logoDark = renderLogo(config?.web?.logoDark);
  if (config?.web?.logoDark) {
    config.web.logoDark = logoDark;
  }

  // Handle all web routes including security routes
  router.get(_webUrls.WebUrlsNamespace.web + '*', function (req, res) {
    (0, _renderHTML.default)(config, manifest, manifestFiles, req, res);
    debug('render html section');
  });
  router.get(_webUrls.WebUrlsNamespace.root, function (req, res) {
    (0, _renderHTML.default)(config, manifest, manifestFiles, req, res);
    debug('render root');
  });
  return router;
}
//# sourceMappingURL=render-web.js.map