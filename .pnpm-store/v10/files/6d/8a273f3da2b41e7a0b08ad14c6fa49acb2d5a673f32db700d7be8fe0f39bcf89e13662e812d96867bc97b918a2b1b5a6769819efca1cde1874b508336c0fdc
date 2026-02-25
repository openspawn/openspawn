"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isObject = isObject;
exports.isPackageNameScoped = isPackageNameScoped;
exports.normalizeMetadata = normalizeMetadata;
exports.validateName = validateName;
exports.validatePackage = validatePackage;
exports.validatePassword = validatePassword;
Object.defineProperty(exports, "validatePublishSingleVersion", {
  enumerable: true,
  get: function () {
    return _publishManifest.validatePublishSingleVersion;
  }
});
Object.defineProperty(exports, "validateUnPublishSingleVersion", {
  enumerable: true,
  get: function () {
    return _unpublishManifest.validateUnPublishSingleVersion;
  }
});
exports.validateUserName = validateUserName;
var _nodeAssert = _interopRequireDefault(require("node:assert"));
var _constants = require("./constants");
var _publishManifest = require("./schemes/publish-manifest");
var _unpublishManifest = require("./schemes/unpublish-manifest");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function isPackageNameScoped(name) {
  return name.startsWith('@');
}

/**
 * From normalize-package-data/lib/fixer.js
 * @param {*} name  the package name
 * @return {Boolean} whether is valid or not
 */
function validateName(name) {
  if (typeof name !== 'string') {
    return false;
  }
  let normalizedName = name.toLowerCase();
  const isScoped = isPackageNameScoped(name);
  const scopedName = name.split('/', 2)[1];
  if (isScoped && typeof scopedName !== 'undefined') {
    normalizedName = scopedName.toLowerCase();
  }

  /**
   * Some context about the first regex
   * - npm used to have a different tarball naming system.
   * eg: http://registry.npmjs.com/thirty-two
   * https://registry.npmjs.org/thirty-two/-/thirty-two@0.0.1.tgz
   * The file name thirty-two@0.0.1.tgz, the version and the pkg name was separated by an at (@)
   * while nowadays the naming system is based in dashes
   * https://registry.npmjs.org/verdaccio/-/verdaccio-1.4.0.tgz
   *
   * more info here: https://github.com/rlidwka/sinopia/issues/75
   */
  return !(!normalizedName.match(/^[-a-zA-Z0-9_.!~*'()@]+$/) || normalizedName.startsWith('.') ||
  // ".bin", etc.
  ['node_modules', '__proto__', 'favicon.ico'].includes(normalizedName));
}

/**
 * Validate a package.
 * @return {Boolean} whether the package is valid or not
 */
function validatePackage(name) {
  const nameList = name.split('/', 2);
  if (nameList.length === 1) {
    // normal package
    return validateName(nameList[0]);
  }
  // scoped package
  return nameList[0][0] === '@' && validateName(nameList[0].slice(1)) && validateName(nameList[1]);
}

/**
 * Validate the package metadata, add additional properties whether are missing within
 * the metadata properties.
 * @param {*} manifest
 * @param {*} name
 * @return {Object} the object with additional properties as dist-tags ad versions
 */
function normalizeMetadata(manifest, name) {
  _nodeAssert.default.strictEqual(manifest.name, name);
  const _manifest = {
    ...manifest
  };
  if (!isObject(manifest[_constants.DIST_TAGS])) {
    _manifest[_constants.DIST_TAGS] = {};
  }
  if (!Array.isArray(manifest[_constants.MAINTAINERS])) {
    _manifest[_constants.MAINTAINERS] = [];
  }

  // This may not be needed
  if (!isObject(manifest['versions'])) {
    _manifest['versions'] = {};
  }
  if (!isObject(manifest['time'])) {
    _manifest['time'] = {};
  }
  return _manifest;
}

/**
 * Check whether an element is an Object
 * @param {*} obj the element
 * @return {Boolean}
 */
function isObject(obj) {
  // if (obj === null || typeof obj === 'undefined' || typeof obj === 'string') {
  //   return false;
  // }

  // return (
  //   (typeof obj === 'object' || typeof obj.prototype === 'undefined') &&
  //   Array.isArray(obj) === false
  // );
  return Object.prototype.toString.call(obj) === '[object Object]';
}
function validatePassword(password, validation = _constants.DEFAULT_PASSWORD_VALIDATION) {
  return typeof password === 'string' && validation instanceof RegExp ? password.match(validation) !== null : false;
}
function validateUserName(userName, expectedName) {
  return typeof userName === 'string' && userName.split(':')[0] === 'org.couchdb.user' && userName.split(':')[1] === expectedName;
}
//# sourceMappingURL=validation-utils.js.map