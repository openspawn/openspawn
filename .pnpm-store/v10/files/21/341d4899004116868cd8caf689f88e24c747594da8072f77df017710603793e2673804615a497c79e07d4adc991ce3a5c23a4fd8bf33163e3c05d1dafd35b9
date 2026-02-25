"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineBaseUrl = combineBaseUrl;
exports.getPublicUrl = getPublicUrl;
exports.getWebProtocol = getWebProtocol;
exports.isHost = isHost;
exports.isURL = void 0;
exports.isURLhasValidProtocol = isURLhasValidProtocol;
exports.validateURL = validateURL;
exports.wrapPrefix = wrapPrefix;
var _debug = _interopRequireDefault(require("debug"));
var _nodeUrl = require("node:url");
var _validator = _interopRequireDefault(require("validator"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:core:url');
const validProtocols = ['https', 'http'];

/**
 * Check if URI is starting with "http://", "https://" or "//"
 * @param {string} uri
 */
function isURLhasValidProtocol(uri) {
  return /^(https?:)?\/\//.test(uri);
}
function isHost(url = '', options = {}) {
  return _validator.default.isURL(url, {
    require_host: true,
    allow_trailing_dot: false,
    require_valid_protocol: false,
    // @ts-ignore
    require_port: false,
    require_tld: false,
    ...options
  });
}

/**
 * Detect running protocol (http or https)
 */
function getWebProtocol(headerProtocol, protocol) {
  let returnProtocol;
  const [, defaultProtocol] = validProtocols;
  // HAProxy variant might return http,http with X-Forwarded-Proto
  if (typeof headerProtocol === 'string' && headerProtocol !== '') {
    debug('header protocol: %o', protocol);
    const commaIndex = headerProtocol.indexOf(',');
    returnProtocol = commaIndex > 0 ? headerProtocol.slice(0, commaIndex) : headerProtocol;
  } else {
    debug('req protocol: %o', headerProtocol);
    returnProtocol = protocol;
  }
  return validProtocols.includes(returnProtocol) ? returnProtocol : defaultProtocol;
}
function wrapPrefix(prefix) {
  if (prefix === '' || typeof prefix === 'undefined' || prefix === null) {
    return '';
  } else if (!prefix.startsWith('/') && prefix.endsWith('/')) {
    return `/${prefix}`;
  } else if (!prefix.startsWith('/') && !prefix.endsWith('/')) {
    return `/${prefix}/`;
  } else if (prefix.startsWith('/') && !prefix.endsWith('/')) {
    return `${prefix}/`;
  } else {
    return prefix;
  }
}

/**
 * Create base url for registry.
 * @return {String} base registry url
 */
function combineBaseUrl(protocol, host, prefix = '') {
  debug('combined protocol %o', protocol);
  debug('combined host %o', host);
  const newPrefix = wrapPrefix(prefix);
  debug('combined prefix %o', newPrefix);
  const groupedURI = new _nodeUrl.URL(wrapPrefix(prefix), `${protocol}://${host}`);
  const result = groupedURI.href;
  debug('combined url %o', result);
  return result;
}
function validateURL(publicUrl) {
  try {
    const parsed = new _nodeUrl.URL(publicUrl);
    if (!validProtocols.includes(parsed.protocol.replace(':', ''))) {
      throw Error('invalid protocol');
    }
    return true;
  } catch (err) {
    // TODO: add error logger here
    return false;
  }
}
function getPublicUrl(url_prefix = '', requestOptions) {
  if (validateURL(process.env.VERDACCIO_PUBLIC_URL)) {
    const envURL = new _nodeUrl.URL(wrapPrefix(url_prefix), process.env.VERDACCIO_PUBLIC_URL).href;
    debug('public url by env %o', envURL);
    return envURL;
  } else if (requestOptions.headers['host']) {
    const host = requestOptions.headers['host'];
    if (!isHost(host)) {
      throw new Error('invalid host');
    }

    // 'X-Forwarded-Proto' is the default header
    const protoHeader = process.env.VERDACCIO_FORWARDED_PROTO?.toLocaleLowerCase() ?? _core.HEADERS.FORWARDED_PROTO.toLowerCase();
    const forwardedProtocolHeaderValue = requestOptions.headers[protoHeader];
    if (Array.isArray(forwardedProtocolHeaderValue)) {
      // This really should never happen - only set-cookie is allowed to have
      // multiple values.
      throw new Error('invalid forwarded protocol header value. Reading header ' + protoHeader);
    }
    const protocol = getWebProtocol(forwardedProtocolHeaderValue, requestOptions.protocol);
    const combinedUrl = combineBaseUrl(protocol, host, url_prefix);
    debug('public url by request %o', combinedUrl);
    return combinedUrl;
  } else {
    return '/';
  }
}
const isURL = exports.isURL = _validator.default.isURL;
//# sourceMappingURL=index.js.map