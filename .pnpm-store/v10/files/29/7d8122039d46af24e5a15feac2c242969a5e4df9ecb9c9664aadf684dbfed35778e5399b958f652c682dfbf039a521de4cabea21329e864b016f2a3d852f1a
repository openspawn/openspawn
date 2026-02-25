"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SUPPORT_ERRORS = exports.APP_ERROR = exports.API_ERROR = void 0;
exports.getBadData = getBadData;
exports.getBadRequest = getBadRequest;
exports.getCode = getCode;
exports.getConflict = getConflict;
exports.getForbidden = getForbidden;
exports.getInternalError = getInternalError;
exports.getNotFound = getNotFound;
exports.getServiceUnavailable = getServiceUnavailable;
exports.getUnauthorized = getUnauthorized;
var _httpErrors = _interopRequireDefault(require("http-errors"));
var _constants = require("./constants");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const API_ERROR = exports.API_ERROR = {
  PASSWORD_SHORT: 'The provided password does not pass the validation',
  MUST_BE_LOGGED: 'You must be logged in to publish packages.',
  PLUGIN_ERROR: 'bug in the auth plugin system',
  CONFIG_BAD_FORMAT: 'config file must be an object',
  BAD_USERNAME_PASSWORD: 'bad username/password, access denied',
  NO_PACKAGE: 'no such package available',
  PACKAGE_CANNOT_BE_ADDED: 'this package cannot be added',
  BAD_DATA: 'bad data',
  NOT_ALLOWED: 'not allowed to access package',
  NOT_ALLOWED_PUBLISH: 'not allowed to publish package',
  INTERNAL_SERVER_ERROR: 'internal server error',
  UNKNOWN_ERROR: 'unknown error',
  NOT_PACKAGE_UPLINK: 'package does not exist on uplink',
  UPLINK_OFFLINE_PUBLISH: 'one of the uplinks is down, refuse to publish',
  UPLINK_OFFLINE: 'uplink is offline',
  NOT_MODIFIED_NO_DATA: 'no data',
  CONTENT_MISMATCH: 'content length mismatch',
  NOT_FILE_UPLINK: "file doesn't exist on uplink",
  MAX_USERS_REACHED: 'maximum amount of users reached',
  VERSION_NOT_EXIST: "this version doesn't exist",
  NO_SUCH_FILE: 'no such file available',
  UNSUPORTED_REGISTRY_CALL: 'unsupported registry call',
  FILE_NOT_FOUND: 'File not found',
  REGISTRATION_DISABLED: 'user registration disabled',
  UNAUTHORIZED_ACCESS: 'unauthorized access',
  BAD_STATUS_CODE: 'bad status code',
  SERVER_TIME_OUT: 'looks like the server is taking to long to respond',
  PACKAGE_EXIST: 'this package is already present',
  BAD_AUTH_HEADER: 'bad authorization header',
  WEB_DISABLED: 'Web interface is disabled in the config file',
  DEPRECATED_BASIC_HEADER: 'basic authentication is deprecated, please use JWT instead',
  BAD_FORMAT_USER_GROUP: 'user groups is different than an array',
  RESOURCE_UNAVAILABLE: 'resource unavailable',
  BAD_PACKAGE_DATA: 'bad incoming package data',
  USERNAME_PASSWORD_REQUIRED: 'username and password is required',
  USERNAME_ALREADY_REGISTERED: 'username is already registered',
  USERNAME_MISMATCH: 'username does not match logged in user',
  SESSION_ID_REQUIRED: 'session id is required',
  SESSION_ID_INVALID: 'session id is invalid',
  SESSION_TOKEN_EXPIRED: 'session token expired'
};
const SUPPORT_ERRORS = exports.SUPPORT_ERRORS = {
  PLUGIN_MISSING_INTERFACE: 'the plugin does not provide implementation of the requested feature',
  TFA_DISABLED: 'the two-factor authentication is not yet supported',
  STORAGE_NOT_IMPLEMENT: 'the storage does not support token saving',
  PARAMETERS_NOT_VALID: 'the parameters are not valid'
};
const APP_ERROR = exports.APP_ERROR = {
  CONFIG_NOT_VALID: 'CONFIG: it does not look like a valid config file',
  PROFILE_ERROR: 'profile unexpected error',
  PASSWORD_VALIDATION: 'not valid password'
};
function getError(code, message) {
  const httpError = (0, _httpErrors.default)(code, message);
  httpError.code = code;
  return httpError;
}
function getConflict(message = API_ERROR.PACKAGE_EXIST) {
  return getError(_constants.HTTP_STATUS.CONFLICT, message);
}
function getBadData(customMessage) {
  return getError(_constants.HTTP_STATUS.BAD_DATA, customMessage || API_ERROR.BAD_DATA);
}
function getBadRequest(customMessage) {
  return getError(_constants.HTTP_STATUS.BAD_REQUEST, customMessage);
}
function getInternalError(customMessage) {
  return customMessage ? getError(_constants.HTTP_STATUS.INTERNAL_ERROR, customMessage) : getError(_constants.HTTP_STATUS.INTERNAL_ERROR, API_ERROR.UNKNOWN_ERROR);
}
function getUnauthorized(message = 'no credentials provided') {
  return getError(_constants.HTTP_STATUS.UNAUTHORIZED, message);
}
function getForbidden(message = "can't use this filename") {
  return getError(_constants.HTTP_STATUS.FORBIDDEN, message);
}
function getServiceUnavailable(message = API_ERROR.RESOURCE_UNAVAILABLE) {
  return getError(_constants.HTTP_STATUS.SERVICE_UNAVAILABLE, message);
}
function getNotFound(customMessage) {
  return getError(_constants.HTTP_STATUS.NOT_FOUND, customMessage || API_ERROR.NO_PACKAGE);
}
function getCode(statusCode, customMessage) {
  return getError(statusCode, customMessage);
}
//# sourceMappingURL=error-utils.js.map