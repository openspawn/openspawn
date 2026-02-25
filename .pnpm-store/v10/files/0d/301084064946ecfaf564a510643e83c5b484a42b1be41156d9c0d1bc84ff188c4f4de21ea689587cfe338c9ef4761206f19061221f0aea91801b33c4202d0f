"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GENERIC_AVATAR = void 0;
exports.addGravatarSupport = addGravatarSupport;
exports.buildToken = buildToken;
exports.deleteProperties = deleteProperties;
exports.formatAuthor = formatAuthor;
exports.generateGravatarUrl = generateGravatarUrl;
exports.getLatestVersion = getLatestVersion;
exports.hasDiffOneKey = hasDiffOneKey;
exports.isObject = isObject;
exports.isVersionValid = isVersionValid;
exports.mask = mask;
exports.normalizeContributors = normalizeContributors;
exports.pad = pad;
exports.validateName = validateName;
exports.validatePackage = validatePackage;
var _lodash = _interopRequireDefault(require("lodash"));
var _core = require("@verdaccio/core");
var _cryptoUtils = require("./crypto-utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * From normalize-package-data/lib/fixer.js
 * @param {*} name  the package name
 * @return {Boolean} whether is valid or not
 * @deprecated
 */
function validateName(name) {
  if (_lodash.default.isString(name) === false) {
    return false;
  }
  let normalizedName = name.toLowerCase();
  const isScoped = name.startsWith('@') && name.includes('/');
  const scopedName = name.split('/', 2)[1];
  if (isScoped && !_lodash.default.isUndefined(scopedName)) {
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
 * @deprecated
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
 * Check whether an element is an Object
 * @param {*} obj the element
 * @return {Boolean}
 * @deprecated
 */
function isObject(obj) {
  return _lodash.default.isObject(obj) && _lodash.default.isNull(obj) === false && _lodash.default.isArray(obj) === false;
}
function getLatestVersion(pkgInfo) {
  return pkgInfo[_core.DIST_TAGS].latest;
}

// @deprecated use @verdaccio/core
function buildToken(type, token) {
  return `${_lodash.default.capitalize(type)} ${token}`;
}

// @deprecated use @verdaccio/web

/**
 * Formats author field for webui.
 * @see https://docs.npmjs.com/files/package.json#author
 * @param {string|object|undefined} author
 * @deprecated use @verdaccio/web
 */
function formatAuthor(author) {
  let authorDetails = {
    name: _core.DEFAULT_USER,
    email: '',
    url: ''
  };
  if (_lodash.default.isNil(author)) {
    return authorDetails;
  }
  if (_lodash.default.isString(author)) {
    authorDetails = {
      ...authorDetails,
      name: author
    };
  }
  if (_lodash.default.isObject(author)) {
    authorDetails = {
      ...authorDetails,
      ...author
    };
  }
  return authorDetails;
}

/**
 * Apply whitespaces based on the length
 * @param {*} str the log message
 * @return {String}
 */
function pad(str, max) {
  if (str.length < max) {
    return str + ' '.repeat(max - str.length);
  }
  return str;
}

/**
 * return a masquerade string with its first and last {charNum} and three dots in between.
 * @param {String} str
 * @param {Number} charNum
 * @returns {String}
 */
function mask(str, charNum = 3) {
  return `${str.slice(0, charNum)}...${str.slice(-charNum)}`;
}

// @deprecated
function hasDiffOneKey(versions) {
  return Object.keys(versions).length !== 1;
}

// @deprecated use @verdaccio/web
function isVersionValid(packageMeta, packageVersion) {
  const hasVersion = typeof packageVersion !== 'undefined';
  if (!hasVersion) {
    return false;
  }
  const hasMatchVersion = Object.keys(packageMeta.versions).includes(packageVersion);
  return hasMatchVersion;
}

// @deprecated use @verdaccio/web
function addGravatarSupport(pkgInfo, online = true) {
  const pkgInfoCopy = {
    ...pkgInfo
  };
  const author = _lodash.default.get(pkgInfo, 'latest.author', null);
  const contributors = normalizeContributors(_lodash.default.get(pkgInfo, 'latest.contributors', []));
  const maintainers = _lodash.default.get(pkgInfo, 'latest.maintainers', []);

  // for author.
  if (author && _lodash.default.isObject(author)) {
    const {
      email
    } = author;
    pkgInfoCopy.latest.author.avatar = generateGravatarUrl(email, online);
  }
  if (author && _lodash.default.isString(author)) {
    pkgInfoCopy.latest.author = {
      avatar: GENERIC_AVATAR,
      email: '',
      author
    };
  }

  // for contributors
  if (_lodash.default.isEmpty(contributors) === false) {
    pkgInfoCopy.latest.contributors = contributors.map(contributor => {
      if (_lodash.default.isObject(contributor)) {
        contributor.avatar = generateGravatarUrl(contributor.email, online);
      } else if (_lodash.default.isString(contributor)) {
        contributor = {
          avatar: GENERIC_AVATAR,
          email: contributor,
          name: contributor
        };
      }
      return contributor;
    });
  }

  // for maintainers
  if (_lodash.default.isEmpty(maintainers) === false) {
    pkgInfoCopy.latest.maintainers = maintainers.map(maintainer => {
      // @ts-ignore
      maintainer.avatar = generateGravatarUrl(maintainer.email, online);
      return maintainer;
    });
  }
  return pkgInfoCopy;
}
const AVATAR_PROVIDER = 'https://www.gravatar.com/avatar/';
// @deprecated use @verdaccio/web
const GENERIC_AVATAR = exports.GENERIC_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg height="100" viewBox="-27 24 100 100" width="100" xmlns="http://www.w3.org/' + '2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><circle cx="23" cy="7' + '4" id="a" r="50"/></defs><use fill="#F5EEE5" overflow="visible" xlink:href="#a"/' + '><clipPath id="b"><use overflow="visible" xlink:href="#a"/></clipPath><g clip-pa' + 'th="url(#b)"><defs><path d="M36 95.9c0 4 4.7 5.2 7.1 5.8 7.6 2 22.8 5.9 22.8 5.9' + ' 3.2 1.1 5.7 3.5 7.1 6.6v9.8H-27v-9.8c1.3-3.1 3.9-5.5 7.1-6.6 0 0 15.2-3.9 22.8-' + '5.9 2.4-.6 7.1-1.8 7.1-5.8V85h26v10.9z" id="c"/></defs><use fill="#E6C19C" overf' + 'low="visible" xlink:href="#c"/><clipPath id="d"><use overflow="visible" xlink:hr' + 'ef="#c"/></clipPath><path clip-path="url(#d)" d="M23.2 35h.2c3.3 0 8.2.2 11.4 2 ' + '3.3 1.9 7.3 5.6 8.5 12.1 2.4 13.7-2.1 35.4-6.3 42.4-4 6.7-9.8 9.2-13.5 9.4H23h-.' + '1c-3.7-.2-9.5-2.7-13.5-9.4-4.2-7-8.7-28.7-6.3-42.4 1.2-6.5 5.2-10.2 8.5-12.1 3.2' + '-1.8 8.1-2 11.4-2h.2z" fill="#D4B08C"/></g><path d="M22.6 40c19.1 0 20.7 13.8 20' + '.8 15.1 1.1 11.9-3 28.1-6.8 33.7-4 5.9-9.8 8.1-13.5 8.3h-.5c-3.8-.3-9.6-2.5-13.6' + '-8.4-3.8-5.6-7.9-21.8-6.8-33.8C2.3 53.7 3.5 40 22.6 40z" fill="#F2CEA5"/></svg>');

/**
 * Generate gravatar url from email address
 * @deprecated use @verdaccio/web
 */
function generateGravatarUrl(email = '', online = true) {
  if (online && _lodash.default.isString(email) && _lodash.default.size(email) > 0) {
    email = email.trim().toLocaleLowerCase();
    const emailMD5 = (0, _cryptoUtils.stringToMD5)(email);
    return `${AVATAR_PROVIDER}${emailMD5}`;
  }
  return GENERIC_AVATAR;
}
function normalizeContributors(contributors) {
  if (_lodash.default.isNil(contributors)) {
    return [];
  } else if (contributors && _lodash.default.isArray(contributors) === false) {
    return [contributors];
  } else if (_lodash.default.isString(contributors)) {
    return [{
      name: contributors
    }];
  }
  return contributors;
}
function deleteProperties(propertiesToDelete, objectItem) {
  _lodash.default.forEach(propertiesToDelete, property => {
    delete objectItem[property];
  });
  return objectItem;
}
//# sourceMappingURL=utils.js.map