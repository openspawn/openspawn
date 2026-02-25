"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = renderHTML;
exports.resolveLogo = resolveLogo;
var _debug = _interopRequireDefault(require("debug"));
var _lruCache = _interopRequireDefault(require("lru-cache"));
var _nodePath = _interopRequireDefault(require("node:path"));
var _nodeUrl = require("node:url");
var _config = require("@verdaccio/config");
var _core = require("@verdaccio/core");
var _url = require("@verdaccio/url");
var _template = _interopRequireDefault(require("./template"));
var _webUtils = require("./web-utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const DEFAULT_LANGUAGE = 'es-US';
const cache = new _lruCache.default({
  max: 500,
  ttl: 1000 * 60 * 60
});
const debug = (0, _debug.default)('verdaccio:web:render');
const defaultManifestFiles = {
  js: ['runtime.js', 'vendors.js', 'main.js'],
  ico: 'favicon.ico',
  css: []
};
function resolveLogo(logo, url_prefix, requestOptions) {
  if (typeof logo !== 'string') {
    return '';
  }
  const isLocalFile = logo && !(0, _url.isURLhasValidProtocol)(logo);
  if (isLocalFile) {
    return `${(0, _url.getPublicUrl)(url_prefix, requestOptions)}-/static/${_nodePath.default.basename(logo)}`;
  } else if ((0, _url.isURLhasValidProtocol)(logo)) {
    return logo;
  } else {
    return '';
  }
}
function renderHTML(config, manifest, manifestFiles, requestOptions, res) {
  const {
    url_prefix
  } = config;
  const base = (0, _url.getPublicUrl)(config?.url_prefix, requestOptions);
  const basename = new _nodeUrl.URL(base).pathname;
  const language = config?.i18n?.web ?? DEFAULT_LANGUAGE;
  const hideDeprecatedVersions = config?.web?.hideDeprecatedVersions ?? false;
  // @ts-ignore
  const needHtmlCache = [undefined, null].includes(config?.web?.html_cache) ? true : config?.web?.html_cache;
  const darkMode = config?.web?.darkMode ?? false;
  const title = config?.web?.title ?? _config.WEB_TITLE;
  const login = (0, _webUtils.hasLogin)(config);
  const scope = config?.web?.scope ?? '';
  const favicon = resolveLogo(config?.web?.favicon, config?.url_prefix, requestOptions);
  const logo = resolveLogo(config?.web?.logo, config?.url_prefix, requestOptions);
  const logoDark = resolveLogo(config?.web?.logoDark, config?.url_prefix, requestOptions);
  const pkgManagers = config?.web?.pkgManagers ?? ['yarn', 'pnpm', 'npm'];
  const version = res.locals.app_version ?? '';
  const flags = {
    ...config.flags,
    // legacy from 5.x
    ...config.experiments
  };
  const primaryColor = (0, _webUtils.validatePrimaryColor)(config?.web?.primary_color ?? config?.web?.primaryColor) ?? '#4b5e40';
  const {
    scriptsBodyAfter,
    metaScripts,
    scriptsbodyBefore,
    // deprecated
    showInfo,
    showSettings,
    showThemeSwitch,
    showFooter,
    showSearch,
    showDownloadTarball,
    showRaw,
    showUplinks
  } = Object.assign({}, {
    scriptsBodyAfter: [],
    bodyBefore: [],
    metaScripts: []
  }, config?.web);
  // Fallback
  let scriptsBodyBefore = config?.web?.scriptsBodyBefore;
  if (scriptsbodyBefore && !scriptsBodyBefore) {
    scriptsBodyBefore = scriptsbodyBefore;
  }
  const options = {
    showInfo,
    showSettings,
    showThemeSwitch,
    showFooter,
    showSearch,
    showDownloadTarball,
    showRaw,
    showUplinks,
    darkMode,
    url_prefix,
    basename,
    base,
    primaryColor,
    version,
    logo,
    logoDark,
    favicon,
    flags,
    login,
    pkgManagers,
    title,
    scope,
    language,
    hideDeprecatedVersions
  };
  let webPage;
  let cacheKey = `template:${JSON.stringify(options)}`;
  try {
    webPage = cache.get(cacheKey);
    if (!webPage) {
      webPage = (0, _template.default)({
        manifest: manifestFiles ?? defaultManifestFiles,
        options,
        scriptsBodyAfter,
        metaScripts,
        scriptsBodyBefore
      }, manifest);
      if (needHtmlCache) {
        cache.set(cacheKey, webPage);
        debug('set template cache');
      }
    } else {
      debug('reuse template cache');
    }
  } catch (error) {
    throw new Error(`theme could not be load, stack ${error.stack}`);
  }
  res.setHeader('Content-Type', _core.HEADERS.TEXT_HTML);
  res.send(webPage);
  debug('web rendered');
}
//# sourceMappingURL=renderHTML.js.map