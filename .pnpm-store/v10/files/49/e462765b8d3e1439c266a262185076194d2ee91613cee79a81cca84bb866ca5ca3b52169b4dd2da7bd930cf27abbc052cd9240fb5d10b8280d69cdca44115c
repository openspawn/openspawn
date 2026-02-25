"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.USERS = exports.TOKEN_BEARER = exports.TOKEN_BASIC = exports.TIME_EXPIRATION_24H = exports.TIME_EXPIRATION_1H = exports.ROLES = exports.PLUGIN_UI_PREFIX = exports.PLUGIN_PREFIX = exports.PLUGIN_CATEGORY = exports.PACKAGE_ACCESS = exports.MAINTAINERS = exports.LOG_VERDACCIO_ERROR = exports.LOG_VERDACCIO_BYTES = exports.LOG_STATUS_MESSAGE = exports.LATEST = exports.HtpasswdHashAlgorithm = exports.HTTP_STATUS = exports.HEADER_TYPE = exports.HEADERS = exports.ERROR_CODE = exports.DIST_TAGS = exports.DEFAULT_USER = exports.DEFAULT_PROTOCOL = exports.DEFAULT_PORT = exports.DEFAULT_PASSWORD_VALIDATION = exports.DEFAULT_DOMAIN = exports.CHARACTER_ENCODING = exports.API_MESSAGE = exports.ANONYMOUS_USER = void 0;
var _httpStatusCodes = _interopRequireDefault(require("http-status-codes"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const DEFAULT_PASSWORD_VALIDATION = exports.DEFAULT_PASSWORD_VALIDATION = /.{3}$/;
const TIME_EXPIRATION_24H = exports.TIME_EXPIRATION_24H = '24h';
const TIME_EXPIRATION_1H = exports.TIME_EXPIRATION_1H = '1h';
const DIST_TAGS = exports.DIST_TAGS = 'dist-tags';
const LATEST = exports.LATEST = 'latest';
const USERS = exports.USERS = 'users';
const MAINTAINERS = exports.MAINTAINERS = 'maintainers';
const DEFAULT_USER = exports.DEFAULT_USER = 'Anonymous'; // for display purposes
const ANONYMOUS_USER = exports.ANONYMOUS_USER = 'anonymous'; // for username purposes

const HEADER_TYPE = exports.HEADER_TYPE = {
  CONTENT_ENCODING: 'content-encoding',
  CONTENT_TYPE: 'content-type',
  CONTENT_LENGTH: 'content-length',
  ACCEPT_ENCODING: 'accept-encoding',
  AUTHORIZATION: 'authorization'
};
const CHARACTER_ENCODING = exports.CHARACTER_ENCODING = {
  UTF8: 'utf8'
};

// @deprecated use Bearer instead
const TOKEN_BASIC = exports.TOKEN_BASIC = 'Basic';
const TOKEN_BEARER = exports.TOKEN_BEARER = 'Bearer';
const HEADERS = exports.HEADERS = {
  ACCEPT: 'Accept',
  ACCEPT_ENCODING: 'Accept-Encoding',
  USER_AGENT: 'User-Agent',
  JSON: 'application/json',
  CONTENT_TYPE: 'Content-type',
  CONTENT_LENGTH: 'content-length',
  TEXT_PLAIN: 'text/plain',
  TEXT_PLAIN_UTF8: 'text/plain; charset=utf-8',
  TEXT_HTML_UTF8: 'text/html; charset=utf-8',
  TEXT_HTML: 'text/html',
  AUTHORIZATION: 'authorization',
  CACHE_CONTROL: 'Cache-Control',
  RETRY_AFTER: 'Retry-After',
  // only set with proxy that setup HTTPS
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto
  FORWARDED_PROTO: 'X-Forwarded-Proto',
  FORWARDED_FOR: 'X-Forwarded-For',
  FRAMES_OPTIONS: 'X-Frame-Options',
  CSP: 'Content-Security-Policy',
  CTO: 'X-Content-Type-Options',
  XSS: 'X-XSS-Protection',
  CLIENT: 'X-Client',
  POWERED_BY: 'X-Powered-By',
  RATELIMIT_LIMIT: 'X-RateLimit-Limit',
  RATELIMIT_REMAINING: 'X-RateLimit-Remaining',
  NONE_MATCH: 'If-None-Match',
  ETAG: 'ETag',
  JSON_CHARSET: 'application/json; charset=utf-8',
  JSON_INSTALL_CHARSET: 'application/vnd.npm.install-v1+json; charset=utf-8',
  OCTET_STREAM: 'application/octet-stream; charset=utf-8',
  TEXT_CHARSET: 'text/plain; charset=utf-8',
  WWW_AUTH: 'WWW-Authenticate',
  GZIP: 'gzip',
  HOST: 'host'
};

/**
 * HTTP status codes used throughout Verdaccio.
 */
const HTTP_STATUS = exports.HTTP_STATUS = {
  /** 202: The request has been accepted for processing, but the processing is not yet complete. */
  ACCEPTED: _httpStatusCodes.default.ACCEPTED,
  /** 200: Standard response for successful HTTP requests. */
  OK: _httpStatusCodes.default.OK,
  /** 201: The request has been fulfilled and resulted in a new resource being created. */
  CREATED: _httpStatusCodes.default.CREATED,
  /** 300: Indicates multiple options for the resource from which the client may choose. */
  MULTIPLE_CHOICES: _httpStatusCodes.default.MULTIPLE_CHOICES,
  /** 304: Indicates that the resource has not been modified since the last request. */
  NOT_MODIFIED: _httpStatusCodes.default.NOT_MODIFIED,
  /** 400: The server could not understand the request due to invalid syntax. */
  BAD_REQUEST: _httpStatusCodes.default.BAD_REQUEST,
  /** 401: The client must authenticate itself to get the requested response. */
  UNAUTHORIZED: _httpStatusCodes.default.UNAUTHORIZED,
  /** 403: The client does not have access rights to the content. */
  FORBIDDEN: _httpStatusCodes.default.FORBIDDEN,
  /** 404: The server can not find the requested resource. */
  NOT_FOUND: _httpStatusCodes.default.NOT_FOUND,
  /** 408: The server timed out waiting for the request. */
  REQUEST_TIMEOUT: _httpStatusCodes.default.REQUEST_TIMEOUT,
  /** 409: The request could not be completed due to a conflict with the current state of the resource. */
  CONFLICT: _httpStatusCodes.default.CONFLICT,
  /** 415: The media format of the requested data is not supported by the server. */
  UNSUPPORTED_MEDIA: _httpStatusCodes.default.UNSUPPORTED_MEDIA_TYPE,
  /** 422: The request was well-formed but was unable to be followed due to semantic errors. */
  BAD_DATA: _httpStatusCodes.default.UNPROCESSABLE_ENTITY,
  /** 500: The server has encountered a situation it doesn't know how to handle. */
  INTERNAL_ERROR: _httpStatusCodes.default.INTERNAL_SERVER_ERROR,
  /** 501: The request method is not supported by the server and cannot be handled. */
  NOT_IMPLEMENTED: _httpStatusCodes.default.NOT_IMPLEMENTED,
  /** 502: The server, while acting as a gateway or proxy, received an invalid response from the upstream server. */
  BAD_GATEWAY: _httpStatusCodes.default.BAD_GATEWAY,
  /** 503: The server is not ready to handle the request. */
  SERVICE_UNAVAILABLE: _httpStatusCodes.default.SERVICE_UNAVAILABLE,
  /** 504: The server, while acting as a gateway or proxy, did not get a response in time from the upstream server. */
  GATEWAY_TIMEOUT: _httpStatusCodes.default.GATEWAY_TIMEOUT,
  /** 508: The server detected an infinite loop while processing the request. */
  LOOP_DETECTED: 508,
  /** 590: Custom Verdaccio code indicating the server cannot handle the request. */
  CANNOT_HANDLE: 590
};
const ERROR_CODE = exports.ERROR_CODE = {
  token_required: 'token is required'
};
const API_MESSAGE = exports.API_MESSAGE = {
  PKG_CREATED: 'created new package',
  PKG_CHANGED: 'package changed',
  PKG_REMOVED: 'package removed',
  PKG_PUBLISHED: 'package published',
  TARBALL_UPLOADED: 'tarball uploaded successfully',
  TARBALL_REMOVED: 'tarball removed',
  TAG_UPDATED: 'tags updated',
  TAG_REMOVED: 'tag removed',
  TAG_ADDED: 'package tagged',
  OK: 'ok',
  LOGGED_OUT: 'Logged out'
};
const LOG_STATUS_MESSAGE = exports.LOG_STATUS_MESSAGE = "@{status}, user: @{user}(@{remoteIP}), req: '@{request.method} @{request.url}'";
const LOG_VERDACCIO_ERROR = exports.LOG_VERDACCIO_ERROR = `${LOG_STATUS_MESSAGE}, error: @{!error}`;
const LOG_VERDACCIO_BYTES = exports.LOG_VERDACCIO_BYTES = `${LOG_STATUS_MESSAGE}, bytes: @{bytes.in}/@{bytes.out}`;
const ROLES = exports.ROLES = {
  $ALL: '$all',
  ALL: 'all',
  $AUTH: '$authenticated',
  $ANONYMOUS: '$anonymous',
  DEPRECATED_ALL: '@all',
  DEPRECATED_AUTH: '@authenticated',
  DEPRECATED_ANONYMOUS: '@anonymous'
};
const PACKAGE_ACCESS = exports.PACKAGE_ACCESS = {
  SCOPE: '@*/*',
  ALL: '**'
};
let HtpasswdHashAlgorithm = exports.HtpasswdHashAlgorithm = /*#__PURE__*/function (HtpasswdHashAlgorithm) {
  HtpasswdHashAlgorithm["md5"] = "md5";
  HtpasswdHashAlgorithm["sha1"] = "sha1";
  HtpasswdHashAlgorithm["crypt"] = "crypt";
  HtpasswdHashAlgorithm["bcrypt"] = "bcrypt";
  return HtpasswdHashAlgorithm;
}({});
const PLUGIN_PREFIX = exports.PLUGIN_PREFIX = 'verdaccio';
const PLUGIN_UI_PREFIX = exports.PLUGIN_UI_PREFIX = 'verdaccio-theme';
const PLUGIN_CATEGORY = exports.PLUGIN_CATEGORY = {
  AUTHENTICATION: 'authentication',
  MIDDLEWARE: 'middleware',
  STORAGE: 'storage',
  FILTER: 'filter',
  THEME: 'theme'
};
const DEFAULT_PORT = exports.DEFAULT_PORT = '4873';
const DEFAULT_PROTOCOL = exports.DEFAULT_PROTOCOL = 'http';
const DEFAULT_DOMAIN = exports.DEFAULT_DOMAIN = 'localhost';
//# sourceMappingURL=constants.js.map