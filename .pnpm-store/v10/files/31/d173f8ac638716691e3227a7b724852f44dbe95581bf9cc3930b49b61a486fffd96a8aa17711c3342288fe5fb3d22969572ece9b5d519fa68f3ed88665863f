"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _request = _interopRequireDefault(require("@cypress/request"));
var _JSONStream = _interopRequireDefault(require("JSONStream"));
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _stream = _interopRequireDefault(require("stream"));
var _url = _interopRequireDefault(require("url"));
var _zlib = _interopRequireDefault(require("zlib"));
var _streams = require("@verdaccio/streams");
var _utils = require("@verdaccio/utils");
var _constants = require("./constants");
var _logger = require("./logger");
var _utils2 = require("./utils");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:proxy');
const encode = function (thing) {
  return encodeURIComponent(thing).replace(/^%40/, '@');
};
const jsonContentType = _constants.HEADERS.JSON;
const contentTypeAccept = `${jsonContentType};`;

/**
 * Just a helper (`config[key] || default` doesn't work because of zeroes)
 */
const setConfig = (config, key, def) => {
  return _lodash.default.isNil(config[key]) === false ? config[key] : def;
};

/**
 * Implements Storage interface
 * (same for storage.js, local-storage.js, up-storage.js)
 */
class ProxyStorage {
  // FIXME: upname is assigned to each instance
  // @ts-ignore

  // FIXME: proxy can be boolean or object, something smells here
  // @ts-ignore

  // @ts-ignore

  /**
   * Constructor
   * @param {*} config
   * @param {*} mainConfig
   */
  constructor(config, mainConfig) {
    this.config = config;
    this.failed_requests = 0;
    // @ts-ignore
    this.userAgent = mainConfig.user_agent ?? 'hidden';
    this.ca = config.ca;
    this.logger = _logger.logger;
    this.server_id = mainConfig.server_id;
    this.url = _url.default.parse(this.config.url);
    this._setupProxy(this.url.hostname, config, mainConfig, this.url.protocol === 'https:');
    this.config.url = this.config.url.replace(/\/$/, '');
    if (this.config.timeout && Number(this.config.timeout) >= 1000) {
      this.logger.warn(['Too big timeout value: ' + this.config.timeout, 'We changed time format to nginx-like one', '(see http://nginx.org/en/docs/syntax.html)', 'so please update your config accordingly'].join('\n'));
    }

    // a bunch of different configurable timers
    this.maxage = (0, _utils2.parseInterval)(setConfig(this.config, 'maxage', '2m'));
    this.timeout = (0, _utils2.parseInterval)(setConfig(this.config, 'timeout', '30s'));
    this.max_fails = Number(setConfig(this.config, 'max_fails', 2));
    this.fail_timeout = (0, _utils2.parseInterval)(setConfig(this.config, 'fail_timeout', '5m'));
    this.strict_ssl = Boolean(setConfig(this.config, 'strict_ssl', true));
    this.agent_options = setConfig(this.config, 'agent_options', {
      keepAlive: true,
      maxSockets: 40,
      maxFreeSockets: 10
    });
  }

  /**
   * Fetch an asset.
   * @param {*} options
   * @param {*} cb
   * @return {Request}
   */
  request(options, cb) {
    let json;
    if (this._statusCheck() === false) {
      const streamRead = new _stream.default.Readable();
      process.nextTick(function () {
        if (cb) {
          cb(_utils2.ErrorCode.getInternalError(_constants.API_ERROR.UPLINK_OFFLINE));
        }
        streamRead.emit('error', _utils2.ErrorCode.getInternalError(_constants.API_ERROR.UPLINK_OFFLINE));
      });
      streamRead._read = function () {};
      // preventing 'Uncaught, unspecified "error" event'
      streamRead.on('error', function () {});
      return streamRead;
    }
    const self = this;
    const headers = this._setHeaders(options);
    this._addProxyHeaders(options.req, headers);
    this._overrideWithUpLinkConfigHeaders(headers);
    const method = options.method || 'GET';
    const uri = options.uri_full || this.config.url + options.uri;
    self.logger.info({
      method: method,
      uri: uri
    }, "making request: '@{method} @{uri}'");
    if ((0, _utils2.isObject)(options.json)) {
      json = JSON.stringify(options.json);
      headers['Content-Type'] = headers['Content-Type'] || _constants.HEADERS.JSON;
    }
    const requestCallback = cb ? function (err, res, body) {
      let error;
      const responseLength = err ? 0 : body.length;
      processBody();
      logActivity();
      cb(err, res, body);

      /**
       * Perform a decode.
       */
      function processBody() {
        if (err) {
          error = err.message;
          return;
        }
        if (options.json && res.statusCode < 300) {
          try {
            body = JSON.parse(body.toString(_constants.CHARACTER_ENCODING.UTF8));
          } catch (_err) {
            body = {};
            err = _err;
            error = err.message;
          }
        }
        if (!err && (0, _utils2.isObject)(body)) {
          if (_lodash.default.isString(body.error)) {
            error = body.error;
          }
        }
      }
      /**
       * Perform a log.
       */
      function logActivity() {
        let message = "@{!status}, req: '@{request.method} @{request.url}'";
        message += error ? ', error: @{!error}' : ', bytes: @{bytes.in}/@{bytes.out}';
        self.logger.http({
          err: err || undefined,
          // if error is null/false change this to undefined so it wont log
          request: {
            method: method,
            url: uri
          },
          status: res != null ? res.statusCode : 'ERR',
          error: error,
          bytes: {
            in: json ? json.length : 0,
            out: responseLength || 0
          }
        }, message);
      }
    } : undefined;
    let requestOptions = {
      url: uri,
      method: method,
      headers: headers,
      body: json,
      proxy: this.proxy,
      encoding: null,
      gzip: true,
      timeout: this.timeout,
      strictSSL: this.strict_ssl,
      agentOptions: this.agent_options
    };
    if (this.ca) {
      requestOptions = Object.assign({}, requestOptions, {
        ca: this.ca
      });
    }
    const req = (0, _request.default)(requestOptions, requestCallback);
    let statusCalled = false;
    req.on('response', function (res) {
      // FIXME: _verdaccio_aborted seems not used
      // @ts-ignore
      if (!req._verdaccio_aborted && !statusCalled) {
        statusCalled = true;
        self._statusCheck(true);
      }
      if (_lodash.default.isNil(requestCallback) === false) {
        (function do_log() {
          const message = "@{!status}, req: '@{request.method} @{request.url}' (streaming)";
          self.logger.http({
            request: {
              method: method,
              url: uri
            },
            status: _lodash.default.isNull(res) === false ? res.statusCode : 'ERR'
          }, message);
        })();
      }
    });
    req.on('error', function (err) {
      // FIXME: _verdaccio_aborted seems not used
      debug('_verdaccio_aborted: %o', err);
      if (!req._verdaccio_aborted && !statusCalled) {
        statusCalled = true;
        self._statusCheck(false);
      }
    });
    return req;
  }

  /**
   * Set default headers.
   * @param {Object} options
   * @return {Object}
   * @private
   */
  _setHeaders(options) {
    const headers = options.headers || {};
    const accept = _constants.HEADERS.ACCEPT;
    const acceptEncoding = _constants.HEADERS.ACCEPT_ENCODING;
    const userAgent = _constants.HEADERS.USER_AGENT;
    headers[accept] = headers[accept] || contentTypeAccept;
    headers[acceptEncoding] = headers[acceptEncoding] || 'gzip';
    // registry.npmjs.org will only return search result if user-agent include string 'npm'
    headers[userAgent] = this.userAgent ? `npm (${this.userAgent})` : options.req?.get('user-agent');
    return this._setAuth(headers);
  }

  /**
   * Validate configuration auth and assign Header authorization
   * @param {Object} headers
   * @return {Object}
   * @private
   */
  _setAuth(headers) {
    const {
      auth
    } = this.config;
    if (_lodash.default.isNil(auth) || headers[_constants.HEADERS.AUTHORIZATION]) {
      return headers;
    }
    if (_lodash.default.isObject(auth) === false && _lodash.default.isObject(auth.token) === false) {
      this._throwErrorAuth('Auth invalid');
    }

    // get NPM_TOKEN http://blog.npmjs.org/post/118393368555/deploying-with-npm-private-modules
    // or get other variable export in env
    // https://github.com/verdaccio/verdaccio/releases/tag/v2.5.0
    let token;
    const tokenConf = auth;
    if (_lodash.default.isNil(tokenConf.token) === false && _lodash.default.isString(tokenConf.token)) {
      token = tokenConf.token;
    } else if (_lodash.default.isNil(tokenConf.token_env) === false) {
      if (_lodash.default.isString(tokenConf.token_env)) {
        token = process.env[tokenConf.token_env];
      } else if (_lodash.default.isBoolean(tokenConf.token_env) && tokenConf.token_env) {
        token = process.env.NPM_TOKEN;
      } else {
        this.logger.error(_constants.ERROR_CODE.token_required);
        this._throwErrorAuth(_constants.ERROR_CODE.token_required);
      }
    } else {
      token = process.env.NPM_TOKEN;
    }
    if (_lodash.default.isNil(token)) {
      this._throwErrorAuth(_constants.ERROR_CODE.token_required);
    }

    // define type Auth allow basic and bearer
    const type = tokenConf.type || _constants.TOKEN_BASIC;
    this._setHeaderAuthorization(headers, type, token);
    return headers;
  }

  /**
   * @param {string} message
   * @throws {Error}
   * @private
   */
  _throwErrorAuth(message) {
    this.logger.error(message);
    throw new Error(message);
  }

  /**
   * Assign Header authorization with type authentication
   * @param {Object} headers
   * @param {string} type
   * @param {string} token
   * @private
   */
  _setHeaderAuthorization(headers, type, token) {
    const _type = type.toLowerCase();
    if ([_constants.TOKEN_BEARER.toLowerCase(), _constants.TOKEN_BASIC.toLowerCase()].includes(_type) === false) {
      this._throwErrorAuth(`Auth type '${_type}' not allowed`);
    }
    type = _lodash.default.upperFirst(type);
    headers[_constants.HEADERS.AUTHORIZATION] = (0, _utils.buildToken)(type, token);
  }

  /**
   * It will add or override specified headers from config file.
   *
   * Eg:
   *
   * uplinks:
   npmjs:
   url: https://registry.npmjs.org/
   headers:
   Accept: "application/vnd.npm.install-v2+json; q=1.0"
   verdaccio-staging:
   url: https://mycompany.com/npm
   headers:
   Accept: "application/json"
   authorization: "Basic YourBase64EncodedCredentials=="
    * @param {Object} headers
   * @private
   */
  _overrideWithUpLinkConfigHeaders(headers) {
    if (!this.config.headers) {
      return headers;
    }

    // add/override headers specified in the config
    /* eslint guard-for-in: 0 */
    for (const key in this.config.headers) {
      headers[key] = this.config.headers[key];
    }
  }

  /**
   * Determine whether can fetch from the provided URL
   * @param {*} url
   * @return {Boolean}
   */
  isUplinkValid(url) {
    const urlParsed = _url.default.parse(url);
    const isHTTPS = urlDomainParsed => urlDomainParsed.protocol === 'https:' && (urlParsed.port === null || urlParsed.port === '443');
    const getHost = urlDomainParsed => isHTTPS(urlDomainParsed) ? urlDomainParsed.hostname : urlDomainParsed.host;
    const isMatchProtocol = urlParsed.protocol === this.url.protocol;
    const isMatchHost = getHost(urlParsed) === getHost(this.url);
    // @ts-ignore
    const isMatchPath = urlParsed.path.indexOf(this.url.path) === 0;
    return isMatchProtocol && isMatchHost && isMatchPath;
  }

  /**
   * Get a remote package metadata
   * @param {*} name package name
   * @param {*} options request options, eg: eTag.
   * @param {*} callback
   */
  getRemoteMetadata(name, options, callback) {
    const headers = {};
    if (_lodash.default.isNil(options.etag) === false) {
      headers['If-None-Match'] = options.etag;
      headers[_constants.HEADERS.ACCEPT] = contentTypeAccept;
    }
    this.request({
      uri: `/${encode(name)}`,
      json: true,
      headers: headers,
      req: options.req
    }, (err, res, body) => {
      if (err) {
        return callback(err);
      }
      if (res.statusCode === _constants.HTTP_STATUS.NOT_FOUND) {
        return callback(_utils2.ErrorCode.getNotFound(_constants.API_ERROR.NOT_PACKAGE_UPLINK));
      }
      if (!(res.statusCode >= _constants.HTTP_STATUS.OK && res.statusCode < _constants.HTTP_STATUS.MULTIPLE_CHOICES)) {
        const error = _utils2.ErrorCode.getInternalError(`${_constants.API_ERROR.BAD_STATUS_CODE}: ${res.statusCode}`);
        error.remoteStatus = res.statusCode;
        return callback(error);
      }
      callback(null, body, res.headers.etag);
    });
  }

  /**
   * Fetch a tarball from the uplink.
   * @param {String} url
   * @return {Stream}
   */
  fetchTarball(url) {
    const stream = new _streams.ReadTarball({});
    let current_length = 0;
    let expected_length;
    stream.abort = () => {};
    const readStream = this.request({
      uri_full: url,
      encoding: null,
      headers: {
        Accept: contentTypeAccept
      }
    });
    readStream.on('response', function (res) {
      if (res.statusCode === _constants.HTTP_STATUS.NOT_FOUND) {
        return stream.emit('error', _utils2.ErrorCode.getNotFound(_constants.API_ERROR.NOT_FILE_UPLINK));
      }
      if (!(res.statusCode >= _constants.HTTP_STATUS.OK && res.statusCode < _constants.HTTP_STATUS.MULTIPLE_CHOICES)) {
        return stream.emit('error', _utils2.ErrorCode.getInternalError(`bad uplink status code: ${res.statusCode}`));
      }
      if (res.headers[_constants.HEADER_TYPE.CONTENT_LENGTH]) {
        expected_length = res.headers[_constants.HEADER_TYPE.CONTENT_LENGTH];
        stream.emit(_constants.HEADER_TYPE.CONTENT_LENGTH, res.headers[_constants.HEADER_TYPE.CONTENT_LENGTH]);
      }
      readStream.pipe(stream);
    });
    readStream.on('error', function (err) {
      stream.emit('error', err);
    });
    readStream.on('data', function (data) {
      current_length += data.length;
    });
    readStream.on('end', function (data) {
      if (data) {
        current_length += data.length;
      }
      if (expected_length && current_length != expected_length) {
        stream.emit('error', _utils2.ErrorCode.getInternalError(_constants.API_ERROR.CONTENT_MISMATCH));
      }
    });
    return stream;
  }

  /**
   * Perform a stream search.
   * @param {*} options request options
   * @return {Stream}
   */
  search(options) {
    const transformStream = new _stream.default.PassThrough({
      objectMode: true
    });
    const requestStream = this.request({
      uri: options.req.url,
      req: options.req,
      headers: {
        // query for search
        referer: options.req.get('referer')
      }
    });
    const parsePackage = pkg => {
      if ((0, _utils2.isObjectOrArray)(pkg)) {
        transformStream.emit('data', pkg);
      }
    };
    requestStream.on('response', res => {
      if (!String(res.statusCode).match(/^2\d\d$/)) {
        return transformStream.emit('error', _utils2.ErrorCode.getInternalError(`bad status code ${res.statusCode} from uplink`));
      }

      // See https://github.com/request/request#requestoptions-callback
      // Request library will not decode gzip stream.
      let jsonStream;
      if (res.headers[_constants.HEADER_TYPE.CONTENT_ENCODING] === _constants.HEADERS.GZIP) {
        jsonStream = res.pipe(_zlib.default.createUnzip());
      } else {
        jsonStream = res;
      }
      jsonStream.pipe(_JSONStream.default.parse('*')).on('data', parsePackage);
      jsonStream.on('end', () => {
        transformStream.emit('end');
      });
    });
    requestStream.on('error', err => {
      transformStream.emit('error', err);
    });
    transformStream.abort = () => {
      // FIXME: this is clearly a potential issue
      // there is no abort method on Stream.Readable
      // @ts-ignore
      requestStream.abort();
      transformStream.emit('end');
    };
    return transformStream;
  }

  /**
   * Add proxy headers.
   * FIXME: object mutations, it should return an new object
   * @param {*} req the http request
   * @param {*} headers the request headers
   */
  _addProxyHeaders(req, headers) {
    if (req) {
      // Only submit X-Forwarded-For field if we don't have a proxy selected
      // in the config file.
      //
      // Otherwise misconfigured proxy could return 407:
      // https://github.com/rlidwka/sinopia/issues/254
      //
      // FIXME: proxy logic is odd, something is wrong here.
      // @ts-ignore
      if (!this.proxy) {
        headers['x-forwarded-for'] = (req.get('x-forwarded-for') ? req.get('x-forwarded-for') + ', ' : '') + req.connection.remoteAddress;
      }
    }

    // always attach Via header to avoid loops, even if we're not proxying
    headers['via'] = req && req.get('via') ? req.get('via') + ', ' : '';
    headers['via'] += '1.1 ' + this.server_id + ' (Verdaccio)';
  }

  /**
   * Check whether the remote host is available.
   * @param {*} alive
   * @return {Boolean}
   */
  _statusCheck(alive) {
    if (arguments.length === 0) {
      return this._ifRequestFailure() === false;
    }
    if (alive) {
      if (this.failed_requests >= this.max_fails) {
        this.logger.warn({
          host: this.url.host
        }, 'host @{host} is back online');
      }
      this.failed_requests = 0;
    } else {
      this.failed_requests++;
      if (this.failed_requests === this.max_fails) {
        this.logger.warn({
          host: this.url.host
        }, 'host @{host} is now offline');
      }
    }
    this.last_request_time = Date.now();
  }

  /**
   * If the request failure.
   * @return {boolean}
   * @private
   */
  _ifRequestFailure() {
    return this.failed_requests >= this.max_fails && Math.abs(Date.now() - this.last_request_time) < this.fail_timeout;
  }

  /**
   * Set up a proxy.
   * @param {*} hostname
   * @param {*} config
   * @param {*} mainconfig
   * @param {*} isHTTPS
   */
  _setupProxy(hostname, config, mainconfig, isHTTPS) {
    let noProxyList;
    const proxy_key = isHTTPS ? 'https_proxy' : 'http_proxy';

    // get http_proxy and no_proxy configs
    if (proxy_key in config) {
      this.proxy = config[proxy_key];
    } else if (proxy_key in mainconfig) {
      this.proxy = mainconfig[proxy_key];
    }
    if ('no_proxy' in config) {
      noProxyList = config.no_proxy;
    } else if ('no_proxy' in mainconfig) {
      noProxyList = mainconfig.no_proxy;
    }

    // use wget-like algorithm to determine if proxy shouldn't be used
    if (hostname[0] !== '.') {
      hostname = '.' + hostname;
    }
    if (_lodash.default.isString(noProxyList) && noProxyList.length) {
      noProxyList = noProxyList.split(',');
    }
    if (_lodash.default.isArray(noProxyList)) {
      for (let i = 0; i < noProxyList.length; i++) {
        let noProxyItem = noProxyList[i];
        if (noProxyItem[0] !== '.') {
          noProxyItem = '.' + noProxyItem;
        }
        if (hostname.lastIndexOf(noProxyItem) === hostname.length - noProxyItem.length) {
          if (this.proxy) {
            debug('not using proxy for %o, excluded by %o rule', this.url.href, noProxyItem);
            // @ts-ignore
            this.proxy = false;
          }
          break;
        }
      }
    }

    // if it's non-string (i.e. "false"), don't use it
    if (_lodash.default.isString(this.proxy) === false) {
      // @ts-ignore
      delete this.proxy;
    } else {
      debug('using proxy %o for %o', this.url.href, this.proxy);
    }
  }
}
var _default = exports.default = ProxyStorage;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfcmVxdWVzdCIsIl9pbnRlcm9wUmVxdWlyZURlZmF1bHQiLCJyZXF1aXJlIiwiX0pTT05TdHJlYW0iLCJfZGVidWciLCJfbG9kYXNoIiwiX3N0cmVhbSIsIl91cmwiLCJfemxpYiIsIl9zdHJlYW1zIiwiX3V0aWxzIiwiX2NvbnN0YW50cyIsIl9sb2dnZXIiLCJfdXRpbHMyIiwiZSIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiZGVidWciLCJidWlsZERlYnVnIiwiZW5jb2RlIiwidGhpbmciLCJlbmNvZGVVUklDb21wb25lbnQiLCJyZXBsYWNlIiwianNvbkNvbnRlbnRUeXBlIiwiSEVBREVSUyIsIkpTT04iLCJjb250ZW50VHlwZUFjY2VwdCIsInNldENvbmZpZyIsImNvbmZpZyIsImtleSIsImRlZiIsIl8iLCJpc05pbCIsIlByb3h5U3RvcmFnZSIsImNvbnN0cnVjdG9yIiwibWFpbkNvbmZpZyIsImZhaWxlZF9yZXF1ZXN0cyIsInVzZXJBZ2VudCIsInVzZXJfYWdlbnQiLCJjYSIsImxvZ2dlciIsInNlcnZlcl9pZCIsInVybCIsIlVSTCIsInBhcnNlIiwiX3NldHVwUHJveHkiLCJob3N0bmFtZSIsInByb3RvY29sIiwidGltZW91dCIsIk51bWJlciIsIndhcm4iLCJqb2luIiwibWF4YWdlIiwicGFyc2VJbnRlcnZhbCIsIm1heF9mYWlscyIsImZhaWxfdGltZW91dCIsInN0cmljdF9zc2wiLCJCb29sZWFuIiwiYWdlbnRfb3B0aW9ucyIsImtlZXBBbGl2ZSIsIm1heFNvY2tldHMiLCJtYXhGcmVlU29ja2V0cyIsInJlcXVlc3QiLCJvcHRpb25zIiwiY2IiLCJqc29uIiwiX3N0YXR1c0NoZWNrIiwic3RyZWFtUmVhZCIsIlN0cmVhbSIsIlJlYWRhYmxlIiwicHJvY2VzcyIsIm5leHRUaWNrIiwiRXJyb3JDb2RlIiwiZ2V0SW50ZXJuYWxFcnJvciIsIkFQSV9FUlJPUiIsIlVQTElOS19PRkZMSU5FIiwiZW1pdCIsIl9yZWFkIiwib24iLCJzZWxmIiwiaGVhZGVycyIsIl9zZXRIZWFkZXJzIiwiX2FkZFByb3h5SGVhZGVycyIsInJlcSIsIl9vdmVycmlkZVdpdGhVcExpbmtDb25maWdIZWFkZXJzIiwibWV0aG9kIiwidXJpIiwidXJpX2Z1bGwiLCJpbmZvIiwiaXNPYmplY3QiLCJzdHJpbmdpZnkiLCJyZXF1ZXN0Q2FsbGJhY2siLCJlcnIiLCJyZXMiLCJib2R5IiwiZXJyb3IiLCJyZXNwb25zZUxlbmd0aCIsImxlbmd0aCIsInByb2Nlc3NCb2R5IiwibG9nQWN0aXZpdHkiLCJtZXNzYWdlIiwic3RhdHVzQ29kZSIsInRvU3RyaW5nIiwiQ0hBUkFDVEVSX0VOQ09ESU5HIiwiVVRGOCIsIl9lcnIiLCJpc1N0cmluZyIsImh0dHAiLCJ1bmRlZmluZWQiLCJzdGF0dXMiLCJieXRlcyIsImluIiwib3V0IiwicmVxdWVzdE9wdGlvbnMiLCJwcm94eSIsImVuY29kaW5nIiwiZ3ppcCIsInN0cmljdFNTTCIsImFnZW50T3B0aW9ucyIsIk9iamVjdCIsImFzc2lnbiIsInN0YXR1c0NhbGxlZCIsIl92ZXJkYWNjaW9fYWJvcnRlZCIsImRvX2xvZyIsImlzTnVsbCIsImFjY2VwdCIsIkFDQ0VQVCIsImFjY2VwdEVuY29kaW5nIiwiQUNDRVBUX0VOQ09ESU5HIiwiVVNFUl9BR0VOVCIsImdldCIsIl9zZXRBdXRoIiwiYXV0aCIsIkFVVEhPUklaQVRJT04iLCJ0b2tlbiIsIl90aHJvd0Vycm9yQXV0aCIsInRva2VuQ29uZiIsInRva2VuX2VudiIsImVudiIsImlzQm9vbGVhbiIsIk5QTV9UT0tFTiIsIkVSUk9SX0NPREUiLCJ0b2tlbl9yZXF1aXJlZCIsInR5cGUiLCJUT0tFTl9CQVNJQyIsIl9zZXRIZWFkZXJBdXRob3JpemF0aW9uIiwiRXJyb3IiLCJfdHlwZSIsInRvTG93ZXJDYXNlIiwiVE9LRU5fQkVBUkVSIiwiaW5jbHVkZXMiLCJ1cHBlckZpcnN0IiwiYnVpbGRUb2tlbiIsImlzVXBsaW5rVmFsaWQiLCJ1cmxQYXJzZWQiLCJpc0hUVFBTIiwidXJsRG9tYWluUGFyc2VkIiwicG9ydCIsImdldEhvc3QiLCJob3N0IiwiaXNNYXRjaFByb3RvY29sIiwiaXNNYXRjaEhvc3QiLCJpc01hdGNoUGF0aCIsInBhdGgiLCJpbmRleE9mIiwiZ2V0UmVtb3RlTWV0YWRhdGEiLCJuYW1lIiwiY2FsbGJhY2siLCJldGFnIiwiSFRUUF9TVEFUVVMiLCJOT1RfRk9VTkQiLCJnZXROb3RGb3VuZCIsIk5PVF9QQUNLQUdFX1VQTElOSyIsIk9LIiwiTVVMVElQTEVfQ0hPSUNFUyIsIkJBRF9TVEFUVVNfQ09ERSIsInJlbW90ZVN0YXR1cyIsImZldGNoVGFyYmFsbCIsInN0cmVhbSIsIlJlYWRUYXJiYWxsIiwiY3VycmVudF9sZW5ndGgiLCJleHBlY3RlZF9sZW5ndGgiLCJhYm9ydCIsInJlYWRTdHJlYW0iLCJBY2NlcHQiLCJOT1RfRklMRV9VUExJTksiLCJIRUFERVJfVFlQRSIsIkNPTlRFTlRfTEVOR1RIIiwicGlwZSIsImRhdGEiLCJDT05URU5UX01JU01BVENIIiwic2VhcmNoIiwidHJhbnNmb3JtU3RyZWFtIiwiUGFzc1Rocm91Z2giLCJvYmplY3RNb2RlIiwicmVxdWVzdFN0cmVhbSIsInJlZmVyZXIiLCJwYXJzZVBhY2thZ2UiLCJwa2ciLCJpc09iamVjdE9yQXJyYXkiLCJTdHJpbmciLCJtYXRjaCIsImpzb25TdHJlYW0iLCJDT05URU5UX0VOQ09ESU5HIiwiR1pJUCIsInpsaWIiLCJjcmVhdGVVbnppcCIsIkpTT05TdHJlYW0iLCJjb25uZWN0aW9uIiwicmVtb3RlQWRkcmVzcyIsImFsaXZlIiwiYXJndW1lbnRzIiwiX2lmUmVxdWVzdEZhaWx1cmUiLCJsYXN0X3JlcXVlc3RfdGltZSIsIkRhdGUiLCJub3ciLCJNYXRoIiwiYWJzIiwibWFpbmNvbmZpZyIsIm5vUHJveHlMaXN0IiwicHJveHlfa2V5Iiwibm9fcHJveHkiLCJzcGxpdCIsImlzQXJyYXkiLCJpIiwibm9Qcm94eUl0ZW0iLCJsYXN0SW5kZXhPZiIsImhyZWYiLCJfZGVmYXVsdCIsImV4cG9ydHMiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3VwLXN0b3JhZ2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHJlcXVlc3QgZnJvbSAnQGN5cHJlc3MvcmVxdWVzdCc7XG5pbXBvcnQgSlNPTlN0cmVhbSBmcm9tICdKU09OU3RyZWFtJztcbmltcG9ydCBidWlsZERlYnVnIGZyb20gJ2RlYnVnJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgU3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgVVJMLCB7IFVybFdpdGhTdHJpbmdRdWVyeSB9IGZyb20gJ3VybCc7XG5pbXBvcnQgemxpYiBmcm9tICd6bGliJztcblxuaW1wb3J0IHsgUmVhZFRhcmJhbGwgfSBmcm9tICdAdmVyZGFjY2lvL3N0cmVhbXMnO1xuaW1wb3J0IHsgQ2FsbGJhY2ssIENvbmZpZywgSGVhZGVycywgTG9nZ2VyLCBQYWNrYWdlLCBVcExpbmtDb25mIH0gZnJvbSAnQHZlcmRhY2Npby90eXBlcyc7XG5pbXBvcnQgeyBidWlsZFRva2VuIH0gZnJvbSAnQHZlcmRhY2Npby91dGlscyc7XG5cbmltcG9ydCB7XG4gIEFQSV9FUlJPUixcbiAgQ0hBUkFDVEVSX0VOQ09ESU5HLFxuICBFUlJPUl9DT0RFLFxuICBIRUFERVJTLFxuICBIRUFERVJfVFlQRSxcbiAgSFRUUF9TVEFUVVMsXG4gIFRPS0VOX0JBU0lDLFxuICBUT0tFTl9CRUFSRVIsXG59IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4vbG9nZ2VyJztcbmltcG9ydCB7IEVycm9yQ29kZSwgaXNPYmplY3QsIGlzT2JqZWN0T3JBcnJheSwgcGFyc2VJbnRlcnZhbCB9IGZyb20gJy4vdXRpbHMnO1xuXG5jb25zdCBkZWJ1ZyA9IGJ1aWxkRGVidWcoJ3ZlcmRhY2Npbzpwcm94eScpO1xuXG5jb25zdCBlbmNvZGUgPSBmdW5jdGlvbiAodGhpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHRoaW5nKS5yZXBsYWNlKC9eJTQwLywgJ0AnKTtcbn07XG5cbmNvbnN0IGpzb25Db250ZW50VHlwZSA9IEhFQURFUlMuSlNPTjtcbmNvbnN0IGNvbnRlbnRUeXBlQWNjZXB0ID0gYCR7anNvbkNvbnRlbnRUeXBlfTtgO1xuXG4vKipcbiAqIEp1c3QgYSBoZWxwZXIgKGBjb25maWdba2V5XSB8fCBkZWZhdWx0YCBkb2Vzbid0IHdvcmsgYmVjYXVzZSBvZiB6ZXJvZXMpXG4gKi9cbmNvbnN0IHNldENvbmZpZyA9IChjb25maWcsIGtleSwgZGVmKTogc3RyaW5nID0+IHtcbiAgcmV0dXJuIF8uaXNOaWwoY29uZmlnW2tleV0pID09PSBmYWxzZSA/IGNvbmZpZ1trZXldIDogZGVmO1xufTtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIFN0b3JhZ2UgaW50ZXJmYWNlXG4gKiAoc2FtZSBmb3Igc3RvcmFnZS5qcywgbG9jYWwtc3RvcmFnZS5qcywgdXAtc3RvcmFnZS5qcylcbiAqL1xuY2xhc3MgUHJveHlTdG9yYWdlIHtcbiAgcHVibGljIGNvbmZpZzogVXBMaW5rQ29uZjtcbiAgcHVibGljIGZhaWxlZF9yZXF1ZXN0czogbnVtYmVyO1xuICBwdWJsaWMgdXNlckFnZW50OiBzdHJpbmc7XG4gIHB1YmxpYyBjYTogc3RyaW5nIHwgdm9pZDtcbiAgcHVibGljIGxvZ2dlcjogTG9nZ2VyO1xuICBwdWJsaWMgc2VydmVyX2lkOiBzdHJpbmc7XG4gIHB1YmxpYyB1cmw6IGFueTtcbiAgcHVibGljIG1heGFnZTogbnVtYmVyO1xuICBwdWJsaWMgdGltZW91dDogbnVtYmVyO1xuICBwdWJsaWMgbWF4X2ZhaWxzOiBudW1iZXI7XG4gIHB1YmxpYyBmYWlsX3RpbWVvdXQ6IG51bWJlcjtcbiAgcHVibGljIGFnZW50X29wdGlvbnM6IGFueTtcbiAgLy8gRklYTUU6IHVwbmFtZSBpcyBhc3NpZ25lZCB0byBlYWNoIGluc3RhbmNlXG4gIC8vIEB0cy1pZ25vcmVcbiAgcHVibGljIHVwbmFtZTogc3RyaW5nO1xuICAvLyBGSVhNRTogcHJveHkgY2FuIGJlIGJvb2xlYW4gb3Igb2JqZWN0LCBzb21ldGhpbmcgc21lbGxzIGhlcmVcbiAgLy8gQHRzLWlnbm9yZVxuICBwdWJsaWMgcHJveHk6IHN0cmluZyB8IHZvaWQ7XG4gIC8vIEB0cy1pZ25vcmVcbiAgcHVibGljIGxhc3RfcmVxdWVzdF90aW1lOiBudW1iZXIgfCBudWxsO1xuICBwdWJsaWMgc3RyaWN0X3NzbDogYm9vbGVhbjtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICogQHBhcmFtIHsqfSBjb25maWdcbiAgICogQHBhcmFtIHsqfSBtYWluQ29uZmlnXG4gICAqL1xuICBwdWJsaWMgY29uc3RydWN0b3IoY29uZmlnOiBVcExpbmtDb25mLCBtYWluQ29uZmlnOiBDb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLmZhaWxlZF9yZXF1ZXN0cyA9IDA7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHRoaXMudXNlckFnZW50ID0gbWFpbkNvbmZpZy51c2VyX2FnZW50ID8/ICdoaWRkZW4nO1xuICAgIHRoaXMuY2EgPSBjb25maWcuY2E7XG4gICAgdGhpcy5sb2dnZXIgPSBsb2dnZXI7XG4gICAgdGhpcy5zZXJ2ZXJfaWQgPSBtYWluQ29uZmlnLnNlcnZlcl9pZDtcblxuICAgIHRoaXMudXJsID0gVVJMLnBhcnNlKHRoaXMuY29uZmlnLnVybCk7XG5cbiAgICB0aGlzLl9zZXR1cFByb3h5KHRoaXMudXJsLmhvc3RuYW1lLCBjb25maWcsIG1haW5Db25maWcsIHRoaXMudXJsLnByb3RvY29sID09PSAnaHR0cHM6Jyk7XG5cbiAgICB0aGlzLmNvbmZpZy51cmwgPSB0aGlzLmNvbmZpZy51cmwucmVwbGFjZSgvXFwvJC8sICcnKTtcblxuICAgIGlmICh0aGlzLmNvbmZpZy50aW1lb3V0ICYmIE51bWJlcih0aGlzLmNvbmZpZy50aW1lb3V0KSA+PSAxMDAwKSB7XG4gICAgICB0aGlzLmxvZ2dlci53YXJuKFxuICAgICAgICBbXG4gICAgICAgICAgJ1RvbyBiaWcgdGltZW91dCB2YWx1ZTogJyArIHRoaXMuY29uZmlnLnRpbWVvdXQsXG4gICAgICAgICAgJ1dlIGNoYW5nZWQgdGltZSBmb3JtYXQgdG8gbmdpbngtbGlrZSBvbmUnLFxuICAgICAgICAgICcoc2VlIGh0dHA6Ly9uZ2lueC5vcmcvZW4vZG9jcy9zeW50YXguaHRtbCknLFxuICAgICAgICAgICdzbyBwbGVhc2UgdXBkYXRlIHlvdXIgY29uZmlnIGFjY29yZGluZ2x5JyxcbiAgICAgICAgXS5qb2luKCdcXG4nKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBhIGJ1bmNoIG9mIGRpZmZlcmVudCBjb25maWd1cmFibGUgdGltZXJzXG4gICAgdGhpcy5tYXhhZ2UgPSBwYXJzZUludGVydmFsKHNldENvbmZpZyh0aGlzLmNvbmZpZywgJ21heGFnZScsICcybScpKTtcbiAgICB0aGlzLnRpbWVvdXQgPSBwYXJzZUludGVydmFsKHNldENvbmZpZyh0aGlzLmNvbmZpZywgJ3RpbWVvdXQnLCAnMzBzJykpO1xuICAgIHRoaXMubWF4X2ZhaWxzID0gTnVtYmVyKHNldENvbmZpZyh0aGlzLmNvbmZpZywgJ21heF9mYWlscycsIDIpKTtcbiAgICB0aGlzLmZhaWxfdGltZW91dCA9IHBhcnNlSW50ZXJ2YWwoc2V0Q29uZmlnKHRoaXMuY29uZmlnLCAnZmFpbF90aW1lb3V0JywgJzVtJykpO1xuICAgIHRoaXMuc3RyaWN0X3NzbCA9IEJvb2xlYW4oc2V0Q29uZmlnKHRoaXMuY29uZmlnLCAnc3RyaWN0X3NzbCcsIHRydWUpKTtcbiAgICB0aGlzLmFnZW50X29wdGlvbnMgPSBzZXRDb25maWcodGhpcy5jb25maWcsICdhZ2VudF9vcHRpb25zJywge1xuICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgbWF4U29ja2V0czogNDAsXG4gICAgICBtYXhGcmVlU29ja2V0czogMTAsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW4gYXNzZXQuXG4gICAqIEBwYXJhbSB7Kn0gb3B0aW9uc1xuICAgKiBAcGFyYW0geyp9IGNiXG4gICAqIEByZXR1cm4ge1JlcXVlc3R9XG4gICAqL1xuICBwcml2YXRlIHJlcXVlc3Qob3B0aW9uczogYW55LCBjYj86IENhbGxiYWNrKTogU3RyZWFtLlJlYWRhYmxlIHtcbiAgICBsZXQganNvbjtcblxuICAgIGlmICh0aGlzLl9zdGF0dXNDaGVjaygpID09PSBmYWxzZSkge1xuICAgICAgY29uc3Qgc3RyZWFtUmVhZCA9IG5ldyBTdHJlYW0uUmVhZGFibGUoKTtcblxuICAgICAgcHJvY2Vzcy5uZXh0VGljayhmdW5jdGlvbiAoKTogdm9pZCB7XG4gICAgICAgIGlmIChjYikge1xuICAgICAgICAgIGNiKEVycm9yQ29kZS5nZXRJbnRlcm5hbEVycm9yKEFQSV9FUlJPUi5VUExJTktfT0ZGTElORSkpO1xuICAgICAgICB9XG4gICAgICAgIHN0cmVhbVJlYWQuZW1pdCgnZXJyb3InLCBFcnJvckNvZGUuZ2V0SW50ZXJuYWxFcnJvcihBUElfRVJST1IuVVBMSU5LX09GRkxJTkUpKTtcbiAgICAgIH0pO1xuXG4gICAgICBzdHJlYW1SZWFkLl9yZWFkID0gZnVuY3Rpb24gKCk6IHZvaWQge307XG4gICAgICAvLyBwcmV2ZW50aW5nICdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50J1xuICAgICAgc3RyZWFtUmVhZC5vbignZXJyb3InLCBmdW5jdGlvbiAoKTogdm9pZCB7fSk7XG4gICAgICByZXR1cm4gc3RyZWFtUmVhZDtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBjb25zdCBoZWFkZXJzOiBIZWFkZXJzID0gdGhpcy5fc2V0SGVhZGVycyhvcHRpb25zKTtcblxuICAgIHRoaXMuX2FkZFByb3h5SGVhZGVycyhvcHRpb25zLnJlcSwgaGVhZGVycyk7XG4gICAgdGhpcy5fb3ZlcnJpZGVXaXRoVXBMaW5rQ29uZmlnSGVhZGVycyhoZWFkZXJzKTtcblxuICAgIGNvbnN0IG1ldGhvZCA9IG9wdGlvbnMubWV0aG9kIHx8ICdHRVQnO1xuICAgIGNvbnN0IHVyaSA9IG9wdGlvbnMudXJpX2Z1bGwgfHwgdGhpcy5jb25maWcudXJsICsgb3B0aW9ucy51cmk7XG5cbiAgICBzZWxmLmxvZ2dlci5pbmZvKFxuICAgICAge1xuICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgdXJpOiB1cmksXG4gICAgICB9LFxuICAgICAgXCJtYWtpbmcgcmVxdWVzdDogJ0B7bWV0aG9kfSBAe3VyaX0nXCJcbiAgICApO1xuXG4gICAgaWYgKGlzT2JqZWN0KG9wdGlvbnMuanNvbikpIHtcbiAgICAgIGpzb24gPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLmpzb24pO1xuICAgICAgaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSBoZWFkZXJzWydDb250ZW50LVR5cGUnXSB8fCBIRUFERVJTLkpTT047XG4gICAgfVxuXG4gICAgY29uc3QgcmVxdWVzdENhbGxiYWNrID0gY2JcbiAgICAgID8gZnVuY3Rpb24gKGVyciwgcmVzLCBib2R5KTogdm9pZCB7XG4gICAgICAgICAgbGV0IGVycm9yO1xuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGVuZ3RoID0gZXJyID8gMCA6IGJvZHkubGVuZ3RoO1xuXG4gICAgICAgICAgcHJvY2Vzc0JvZHkoKTtcbiAgICAgICAgICBsb2dBY3Rpdml0eSgpO1xuXG4gICAgICAgICAgY2IoZXJyLCByZXMsIGJvZHkpO1xuXG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogUGVyZm9ybSBhIGRlY29kZS5cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBmdW5jdGlvbiBwcm9jZXNzQm9keSgpOiB2b2lkIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgZXJyb3IgPSBlcnIubWVzc2FnZTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5qc29uICYmIHJlcy5zdGF0dXNDb2RlIDwgMzAwKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYm9keSA9IEpTT04ucGFyc2UoYm9keS50b1N0cmluZyhDSEFSQUNURVJfRU5DT0RJTkcuVVRGOCkpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChfZXJyKSB7XG4gICAgICAgICAgICAgICAgYm9keSA9IHt9O1xuICAgICAgICAgICAgICAgIGVyciA9IF9lcnI7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBlcnIubWVzc2FnZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWVyciAmJiBpc09iamVjdChib2R5KSkge1xuICAgICAgICAgICAgICBpZiAoXy5pc1N0cmluZyhib2R5LmVycm9yKSkge1xuICAgICAgICAgICAgICAgIGVycm9yID0gYm9keS5lcnJvcjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBQZXJmb3JtIGEgbG9nLlxuICAgICAgICAgICAqL1xuICAgICAgICAgIGZ1bmN0aW9uIGxvZ0FjdGl2aXR5KCk6IHZvaWQge1xuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIkB7IXN0YXR1c30sIHJlcTogJ0B7cmVxdWVzdC5tZXRob2R9IEB7cmVxdWVzdC51cmx9J1wiO1xuICAgICAgICAgICAgbWVzc2FnZSArPSBlcnJvciA/ICcsIGVycm9yOiBAeyFlcnJvcn0nIDogJywgYnl0ZXM6IEB7Ynl0ZXMuaW59L0B7Ynl0ZXMub3V0fSc7XG4gICAgICAgICAgICBzZWxmLmxvZ2dlci5odHRwKFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZXJyOiBlcnIgfHwgdW5kZWZpbmVkLCAvLyBpZiBlcnJvciBpcyBudWxsL2ZhbHNlIGNoYW5nZSB0aGlzIHRvIHVuZGVmaW5lZCBzbyBpdCB3b250IGxvZ1xuICAgICAgICAgICAgICAgIHJlcXVlc3Q6IHsgbWV0aG9kOiBtZXRob2QsIHVybDogdXJpIH0sXG4gICAgICAgICAgICAgICAgc3RhdHVzOiByZXMgIT0gbnVsbCA/IHJlcy5zdGF0dXNDb2RlIDogJ0VSUicsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxuICAgICAgICAgICAgICAgIGJ5dGVzOiB7XG4gICAgICAgICAgICAgICAgICBpbjoganNvbiA/IGpzb24ubGVuZ3RoIDogMCxcbiAgICAgICAgICAgICAgICAgIG91dDogcmVzcG9uc2VMZW5ndGggfHwgMCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBtZXNzYWdlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgbGV0IHJlcXVlc3RPcHRpb25zOiByZXF1ZXN0Lk9wdGlvbnNXaXRoVXJsID0ge1xuICAgICAgdXJsOiB1cmksXG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICBib2R5OiBqc29uLFxuICAgICAgcHJveHk6IHRoaXMucHJveHksXG4gICAgICBlbmNvZGluZzogbnVsbCxcbiAgICAgIGd6aXA6IHRydWUsXG4gICAgICB0aW1lb3V0OiB0aGlzLnRpbWVvdXQsXG4gICAgICBzdHJpY3RTU0w6IHRoaXMuc3RyaWN0X3NzbCxcbiAgICAgIGFnZW50T3B0aW9uczogdGhpcy5hZ2VudF9vcHRpb25zLFxuICAgIH07XG5cbiAgICBpZiAodGhpcy5jYSkge1xuICAgICAgcmVxdWVzdE9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCByZXF1ZXN0T3B0aW9ucywge1xuICAgICAgICBjYTogdGhpcy5jYSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHJlcSA9IHJlcXVlc3QocmVxdWVzdE9wdGlvbnMsIHJlcXVlc3RDYWxsYmFjayk7XG5cbiAgICBsZXQgc3RhdHVzQ2FsbGVkID0gZmFsc2U7XG4gICAgcmVxLm9uKCdyZXNwb25zZScsIGZ1bmN0aW9uIChyZXMpOiB2b2lkIHtcbiAgICAgIC8vIEZJWE1FOiBfdmVyZGFjY2lvX2Fib3J0ZWQgc2VlbXMgbm90IHVzZWRcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGlmICghcmVxLl92ZXJkYWNjaW9fYWJvcnRlZCAmJiAhc3RhdHVzQ2FsbGVkKSB7XG4gICAgICAgIHN0YXR1c0NhbGxlZCA9IHRydWU7XG4gICAgICAgIHNlbGYuX3N0YXR1c0NoZWNrKHRydWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAoXy5pc05pbChyZXF1ZXN0Q2FsbGJhY2spID09PSBmYWxzZSkge1xuICAgICAgICAoZnVuY3Rpb24gZG9fbG9nKCk6IHZvaWQge1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBcIkB7IXN0YXR1c30sIHJlcTogJ0B7cmVxdWVzdC5tZXRob2R9IEB7cmVxdWVzdC51cmx9JyAoc3RyZWFtaW5nKVwiO1xuICAgICAgICAgIHNlbGYubG9nZ2VyLmh0dHAoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICAgICAgICB1cmw6IHVyaSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBfLmlzTnVsbChyZXMpID09PSBmYWxzZSA/IHJlcy5zdGF0dXNDb2RlIDogJ0VSUicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWVzc2FnZVxuICAgICAgICAgICk7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpOiB2b2lkIHtcbiAgICAgIC8vIEZJWE1FOiBfdmVyZGFjY2lvX2Fib3J0ZWQgc2VlbXMgbm90IHVzZWRcbiAgICAgIGRlYnVnKCdfdmVyZGFjY2lvX2Fib3J0ZWQ6ICVvJywgZXJyKTtcbiAgICAgIGlmICghcmVxLl92ZXJkYWNjaW9fYWJvcnRlZCAmJiAhc3RhdHVzQ2FsbGVkKSB7XG4gICAgICAgIHN0YXR1c0NhbGxlZCA9IHRydWU7XG4gICAgICAgIHNlbGYuX3N0YXR1c0NoZWNrKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXE7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGRlZmF1bHQgaGVhZGVycy5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0SGVhZGVycyhvcHRpb25zOiBhbnkpOiBIZWFkZXJzIHtcbiAgICBjb25zdCBoZWFkZXJzID0gb3B0aW9ucy5oZWFkZXJzIHx8IHt9O1xuICAgIGNvbnN0IGFjY2VwdCA9IEhFQURFUlMuQUNDRVBUO1xuICAgIGNvbnN0IGFjY2VwdEVuY29kaW5nID0gSEVBREVSUy5BQ0NFUFRfRU5DT0RJTkc7XG4gICAgY29uc3QgdXNlckFnZW50ID0gSEVBREVSUy5VU0VSX0FHRU5UO1xuXG4gICAgaGVhZGVyc1thY2NlcHRdID0gaGVhZGVyc1thY2NlcHRdIHx8IGNvbnRlbnRUeXBlQWNjZXB0O1xuICAgIGhlYWRlcnNbYWNjZXB0RW5jb2RpbmddID0gaGVhZGVyc1thY2NlcHRFbmNvZGluZ10gfHwgJ2d6aXAnO1xuICAgIC8vIHJlZ2lzdHJ5Lm5wbWpzLm9yZyB3aWxsIG9ubHkgcmV0dXJuIHNlYXJjaCByZXN1bHQgaWYgdXNlci1hZ2VudCBpbmNsdWRlIHN0cmluZyAnbnBtJ1xuICAgIGhlYWRlcnNbdXNlckFnZW50XSA9IHRoaXMudXNlckFnZW50XG4gICAgICA/IGBucG0gKCR7dGhpcy51c2VyQWdlbnR9KWBcbiAgICAgIDogb3B0aW9ucy5yZXE/LmdldCgndXNlci1hZ2VudCcpO1xuXG4gICAgcmV0dXJuIHRoaXMuX3NldEF1dGgoaGVhZGVycyk7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgY29uZmlndXJhdGlvbiBhdXRoIGFuZCBhc3NpZ24gSGVhZGVyIGF1dGhvcml6YXRpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGhlYWRlcnNcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0QXV0aChoZWFkZXJzOiBhbnkpOiBIZWFkZXJzIHtcbiAgICBjb25zdCB7IGF1dGggfSA9IHRoaXMuY29uZmlnO1xuXG4gICAgaWYgKF8uaXNOaWwoYXV0aCkgfHwgaGVhZGVyc1tIRUFERVJTLkFVVEhPUklaQVRJT05dKSB7XG4gICAgICByZXR1cm4gaGVhZGVycztcbiAgICB9XG5cbiAgICBpZiAoXy5pc09iamVjdChhdXRoKSA9PT0gZmFsc2UgJiYgXy5pc09iamVjdCgoYXV0aCBhcyBhbnkpLnRva2VuKSA9PT0gZmFsc2UpIHtcbiAgICAgIHRoaXMuX3Rocm93RXJyb3JBdXRoKCdBdXRoIGludmFsaWQnKTtcbiAgICB9XG5cbiAgICAvLyBnZXQgTlBNX1RPS0VOIGh0dHA6Ly9ibG9nLm5wbWpzLm9yZy9wb3N0LzExODM5MzM2ODU1NS9kZXBsb3lpbmctd2l0aC1ucG0tcHJpdmF0ZS1tb2R1bGVzXG4gICAgLy8gb3IgZ2V0IG90aGVyIHZhcmlhYmxlIGV4cG9ydCBpbiBlbnZcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdmVyZGFjY2lvL3ZlcmRhY2Npby9yZWxlYXNlcy90YWcvdjIuNS4wXG4gICAgbGV0IHRva2VuOiBhbnk7XG4gICAgY29uc3QgdG9rZW5Db25mOiBhbnkgPSBhdXRoO1xuXG4gICAgaWYgKF8uaXNOaWwodG9rZW5Db25mLnRva2VuKSA9PT0gZmFsc2UgJiYgXy5pc1N0cmluZyh0b2tlbkNvbmYudG9rZW4pKSB7XG4gICAgICB0b2tlbiA9IHRva2VuQ29uZi50b2tlbjtcbiAgICB9IGVsc2UgaWYgKF8uaXNOaWwodG9rZW5Db25mLnRva2VuX2VudikgPT09IGZhbHNlKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyh0b2tlbkNvbmYudG9rZW5fZW52KSkge1xuICAgICAgICB0b2tlbiA9IHByb2Nlc3MuZW52W3Rva2VuQ29uZi50b2tlbl9lbnZdO1xuICAgICAgfSBlbHNlIGlmIChfLmlzQm9vbGVhbih0b2tlbkNvbmYudG9rZW5fZW52KSAmJiB0b2tlbkNvbmYudG9rZW5fZW52KSB7XG4gICAgICAgIHRva2VuID0gcHJvY2Vzcy5lbnYuTlBNX1RPS0VOO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoRVJST1JfQ09ERS50b2tlbl9yZXF1aXJlZCk7XG4gICAgICAgIHRoaXMuX3Rocm93RXJyb3JBdXRoKEVSUk9SX0NPREUudG9rZW5fcmVxdWlyZWQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0b2tlbiA9IHByb2Nlc3MuZW52Lk5QTV9UT0tFTjtcbiAgICB9XG5cbiAgICBpZiAoXy5pc05pbCh0b2tlbikpIHtcbiAgICAgIHRoaXMuX3Rocm93RXJyb3JBdXRoKEVSUk9SX0NPREUudG9rZW5fcmVxdWlyZWQpO1xuICAgIH1cblxuICAgIC8vIGRlZmluZSB0eXBlIEF1dGggYWxsb3cgYmFzaWMgYW5kIGJlYXJlclxuICAgIGNvbnN0IHR5cGUgPSB0b2tlbkNvbmYudHlwZSB8fCBUT0tFTl9CQVNJQztcbiAgICB0aGlzLl9zZXRIZWFkZXJBdXRob3JpemF0aW9uKGhlYWRlcnMsIHR5cGUsIHRva2VuKTtcblxuICAgIHJldHVybiBoZWFkZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEB0aHJvd3Mge0Vycm9yfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfdGhyb3dFcnJvckF1dGgobWVzc2FnZTogc3RyaW5nKTogRXJyb3Ige1xuICAgIHRoaXMubG9nZ2VyLmVycm9yKG1lc3NhZ2UpO1xuICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NpZ24gSGVhZGVyIGF1dGhvcml6YXRpb24gd2l0aCB0eXBlIGF1dGhlbnRpY2F0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBoZWFkZXJzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfc2V0SGVhZGVyQXV0aG9yaXphdGlvbihoZWFkZXJzOiBhbnksIHR5cGU6IHN0cmluZywgdG9rZW46IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IF90eXBlOiBzdHJpbmcgPSB0eXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICBpZiAoW1RPS0VOX0JFQVJFUi50b0xvd2VyQ2FzZSgpLCBUT0tFTl9CQVNJQy50b0xvd2VyQ2FzZSgpXS5pbmNsdWRlcyhfdHlwZSkgPT09IGZhbHNlKSB7XG4gICAgICB0aGlzLl90aHJvd0Vycm9yQXV0aChgQXV0aCB0eXBlICcke190eXBlfScgbm90IGFsbG93ZWRgKTtcbiAgICB9XG5cbiAgICB0eXBlID0gXy51cHBlckZpcnN0KHR5cGUpO1xuICAgIGhlYWRlcnNbSEVBREVSUy5BVVRIT1JJWkFUSU9OXSA9IGJ1aWxkVG9rZW4odHlwZSwgdG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0IHdpbGwgYWRkIG9yIG92ZXJyaWRlIHNwZWNpZmllZCBoZWFkZXJzIGZyb20gY29uZmlnIGZpbGUuXG4gICAqXG4gICAqIEVnOlxuICAgKlxuICAgKiB1cGxpbmtzOlxuICAgbnBtanM6XG4gICB1cmw6IGh0dHBzOi8vcmVnaXN0cnkubnBtanMub3JnL1xuICAgaGVhZGVyczpcbiAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi92bmQubnBtLmluc3RhbGwtdjIranNvbjsgcT0xLjBcIlxuICAgdmVyZGFjY2lvLXN0YWdpbmc6XG4gICB1cmw6IGh0dHBzOi8vbXljb21wYW55LmNvbS9ucG1cbiAgIGhlYWRlcnM6XG4gICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICBhdXRob3JpemF0aW9uOiBcIkJhc2ljIFlvdXJCYXNlNjRFbmNvZGVkQ3JlZGVudGlhbHM9PVwiXG5cbiAgICogQHBhcmFtIHtPYmplY3R9IGhlYWRlcnNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIHByaXZhdGUgX292ZXJyaWRlV2l0aFVwTGlua0NvbmZpZ0hlYWRlcnMoaGVhZGVyczogSGVhZGVycyk6IGFueSB7XG4gICAgaWYgKCF0aGlzLmNvbmZpZy5oZWFkZXJzKSB7XG4gICAgICByZXR1cm4gaGVhZGVycztcbiAgICB9XG5cbiAgICAvLyBhZGQvb3ZlcnJpZGUgaGVhZGVycyBzcGVjaWZpZWQgaW4gdGhlIGNvbmZpZ1xuICAgIC8qIGVzbGludCBndWFyZC1mb3ItaW46IDAgKi9cbiAgICBmb3IgKGNvbnN0IGtleSBpbiB0aGlzLmNvbmZpZy5oZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzW2tleV0gPSB0aGlzLmNvbmZpZy5oZWFkZXJzW2tleV07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZSB3aGV0aGVyIGNhbiBmZXRjaCBmcm9tIHRoZSBwcm92aWRlZCBVUkxcbiAgICogQHBhcmFtIHsqfSB1cmxcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG4gIHB1YmxpYyBpc1VwbGlua1ZhbGlkKHVybDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdXJsUGFyc2VkOiBVcmxXaXRoU3RyaW5nUXVlcnkgPSBVUkwucGFyc2UodXJsKTtcbiAgICBjb25zdCBpc0hUVFBTID0gKHVybERvbWFpblBhcnNlZDogVVJMKTogYm9vbGVhbiA9PlxuICAgICAgdXJsRG9tYWluUGFyc2VkLnByb3RvY29sID09PSAnaHR0cHM6JyAmJlxuICAgICAgKHVybFBhcnNlZC5wb3J0ID09PSBudWxsIHx8IHVybFBhcnNlZC5wb3J0ID09PSAnNDQzJyk7XG4gICAgY29uc3QgZ2V0SG9zdCA9ICh1cmxEb21haW5QYXJzZWQpOiBib29sZWFuID0+XG4gICAgICBpc0hUVFBTKHVybERvbWFpblBhcnNlZCkgPyB1cmxEb21haW5QYXJzZWQuaG9zdG5hbWUgOiB1cmxEb21haW5QYXJzZWQuaG9zdDtcbiAgICBjb25zdCBpc01hdGNoUHJvdG9jb2w6IGJvb2xlYW4gPSB1cmxQYXJzZWQucHJvdG9jb2wgPT09IHRoaXMudXJsLnByb3RvY29sO1xuICAgIGNvbnN0IGlzTWF0Y2hIb3N0OiBib29sZWFuID0gZ2V0SG9zdCh1cmxQYXJzZWQpID09PSBnZXRIb3N0KHRoaXMudXJsKTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgY29uc3QgaXNNYXRjaFBhdGg6IGJvb2xlYW4gPSB1cmxQYXJzZWQucGF0aC5pbmRleE9mKHRoaXMudXJsLnBhdGgpID09PSAwO1xuXG4gICAgcmV0dXJuIGlzTWF0Y2hQcm90b2NvbCAmJiBpc01hdGNoSG9zdCAmJiBpc01hdGNoUGF0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByZW1vdGUgcGFja2FnZSBtZXRhZGF0YVxuICAgKiBAcGFyYW0geyp9IG5hbWUgcGFja2FnZSBuYW1lXG4gICAqIEBwYXJhbSB7Kn0gb3B0aW9ucyByZXF1ZXN0IG9wdGlvbnMsIGVnOiBlVGFnLlxuICAgKiBAcGFyYW0geyp9IGNhbGxiYWNrXG4gICAqL1xuICBwdWJsaWMgZ2V0UmVtb3RlTWV0YWRhdGEobmFtZTogc3RyaW5nLCBvcHRpb25zOiBhbnksIGNhbGxiYWNrOiBDYWxsYmFjayk6IHZvaWQge1xuICAgIGNvbnN0IGhlYWRlcnMgPSB7fTtcbiAgICBpZiAoXy5pc05pbChvcHRpb25zLmV0YWcpID09PSBmYWxzZSkge1xuICAgICAgaGVhZGVyc1snSWYtTm9uZS1NYXRjaCddID0gb3B0aW9ucy5ldGFnO1xuICAgICAgaGVhZGVyc1tIRUFERVJTLkFDQ0VQVF0gPSBjb250ZW50VHlwZUFjY2VwdDtcbiAgICB9XG5cbiAgICB0aGlzLnJlcXVlc3QoXG4gICAgICB7XG4gICAgICAgIHVyaTogYC8ke2VuY29kZShuYW1lKX1gLFxuICAgICAgICBqc29uOiB0cnVlLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICByZXE6IG9wdGlvbnMucmVxLFxuICAgICAgfSxcbiAgICAgIChlcnIsIHJlcywgYm9keSk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlcy5zdGF0dXNDb2RlID09PSBIVFRQX1NUQVRVUy5OT1RfRk9VTkQpIHtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soRXJyb3JDb2RlLmdldE5vdEZvdW5kKEFQSV9FUlJPUi5OT1RfUEFDS0FHRV9VUExJTkspKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIShyZXMuc3RhdHVzQ29kZSA+PSBIVFRQX1NUQVRVUy5PSyAmJiByZXMuc3RhdHVzQ29kZSA8IEhUVFBfU1RBVFVTLk1VTFRJUExFX0NIT0lDRVMpKSB7XG4gICAgICAgICAgY29uc3QgZXJyb3IgPSBFcnJvckNvZGUuZ2V0SW50ZXJuYWxFcnJvcihcbiAgICAgICAgICAgIGAke0FQSV9FUlJPUi5CQURfU1RBVFVTX0NPREV9OiAke3Jlcy5zdGF0dXNDb2RlfWBcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgZXJyb3IucmVtb3RlU3RhdHVzID0gcmVzLnN0YXR1c0NvZGU7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhudWxsLCBib2R5LCByZXMuaGVhZGVycy5ldGFnKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGEgdGFyYmFsbCBmcm9tIHRoZSB1cGxpbmsuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgcHVibGljIGZldGNoVGFyYmFsbCh1cmw6IHN0cmluZykge1xuICAgIGNvbnN0IHN0cmVhbSA9IG5ldyBSZWFkVGFyYmFsbCh7fSk7XG4gICAgbGV0IGN1cnJlbnRfbGVuZ3RoID0gMDtcbiAgICBsZXQgZXhwZWN0ZWRfbGVuZ3RoO1xuXG4gICAgc3RyZWFtLmFib3J0ID0gKCkgPT4ge307XG4gICAgY29uc3QgcmVhZFN0cmVhbSA9IHRoaXMucmVxdWVzdCh7XG4gICAgICB1cmlfZnVsbDogdXJsLFxuICAgICAgZW5jb2Rpbmc6IG51bGwsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIEFjY2VwdDogY29udGVudFR5cGVBY2NlcHQsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmVhZFN0cmVhbS5vbigncmVzcG9uc2UnLCBmdW5jdGlvbiAocmVzOiBhbnkpIHtcbiAgICAgIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gSFRUUF9TVEFUVVMuTk9UX0ZPVU5EKSB7XG4gICAgICAgIHJldHVybiBzdHJlYW0uZW1pdCgnZXJyb3InLCBFcnJvckNvZGUuZ2V0Tm90Rm91bmQoQVBJX0VSUk9SLk5PVF9GSUxFX1VQTElOSykpO1xuICAgICAgfVxuICAgICAgaWYgKCEocmVzLnN0YXR1c0NvZGUgPj0gSFRUUF9TVEFUVVMuT0sgJiYgcmVzLnN0YXR1c0NvZGUgPCBIVFRQX1NUQVRVUy5NVUxUSVBMRV9DSE9JQ0VTKSkge1xuICAgICAgICByZXR1cm4gc3RyZWFtLmVtaXQoXG4gICAgICAgICAgJ2Vycm9yJyxcbiAgICAgICAgICBFcnJvckNvZGUuZ2V0SW50ZXJuYWxFcnJvcihgYmFkIHVwbGluayBzdGF0dXMgY29kZTogJHtyZXMuc3RhdHVzQ29kZX1gKVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKHJlcy5oZWFkZXJzW0hFQURFUl9UWVBFLkNPTlRFTlRfTEVOR1RIXSkge1xuICAgICAgICBleHBlY3RlZF9sZW5ndGggPSByZXMuaGVhZGVyc1tIRUFERVJfVFlQRS5DT05URU5UX0xFTkdUSF07XG4gICAgICAgIHN0cmVhbS5lbWl0KEhFQURFUl9UWVBFLkNPTlRFTlRfTEVOR1RILCByZXMuaGVhZGVyc1tIRUFERVJfVFlQRS5DT05URU5UX0xFTkdUSF0pO1xuICAgICAgfVxuXG4gICAgICByZWFkU3RyZWFtLnBpcGUoc3RyZWFtKTtcbiAgICB9KTtcblxuICAgIHJlYWRTdHJlYW0ub24oJ2Vycm9yJywgZnVuY3Rpb24gKGVycikge1xuICAgICAgc3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICB9KTtcbiAgICByZWFkU3RyZWFtLm9uKCdkYXRhJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGN1cnJlbnRfbGVuZ3RoICs9IGRhdGEubGVuZ3RoO1xuICAgIH0pO1xuICAgIHJlYWRTdHJlYW0ub24oJ2VuZCcsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBpZiAoZGF0YSkge1xuICAgICAgICBjdXJyZW50X2xlbmd0aCArPSBkYXRhLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChleHBlY3RlZF9sZW5ndGggJiYgY3VycmVudF9sZW5ndGggIT0gZXhwZWN0ZWRfbGVuZ3RoKSB7XG4gICAgICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIEVycm9yQ29kZS5nZXRJbnRlcm5hbEVycm9yKEFQSV9FUlJPUi5DT05URU5UX01JU01BVENIKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGEgc3RyZWFtIHNlYXJjaC5cbiAgICogQHBhcmFtIHsqfSBvcHRpb25zIHJlcXVlc3Qgb3B0aW9uc1xuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBwdWJsaWMgc2VhcmNoKG9wdGlvbnM6IGFueSkge1xuICAgIGNvbnN0IHRyYW5zZm9ybVN0cmVhbTogYW55ID0gbmV3IFN0cmVhbS5QYXNzVGhyb3VnaCh7IG9iamVjdE1vZGU6IHRydWUgfSk7XG4gICAgY29uc3QgcmVxdWVzdFN0cmVhbTogU3RyZWFtLlJlYWRhYmxlID0gdGhpcy5yZXF1ZXN0KHtcbiAgICAgIHVyaTogb3B0aW9ucy5yZXEudXJsLFxuICAgICAgcmVxOiBvcHRpb25zLnJlcSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgLy8gcXVlcnkgZm9yIHNlYXJjaFxuICAgICAgICByZWZlcmVyOiBvcHRpb25zLnJlcS5nZXQoJ3JlZmVyZXInKSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBwYXJzZVBhY2thZ2UgPSAocGtnOiBQYWNrYWdlKTogdm9pZCA9PiB7XG4gICAgICBpZiAoaXNPYmplY3RPckFycmF5KHBrZykpIHtcbiAgICAgICAgdHJhbnNmb3JtU3RyZWFtLmVtaXQoJ2RhdGEnLCBwa2cpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXF1ZXN0U3RyZWFtLm9uKCdyZXNwb25zZScsIChyZXMpOiB2b2lkID0+IHtcbiAgICAgIGlmICghU3RyaW5nKHJlcy5zdGF0dXNDb2RlKS5tYXRjaCgvXjJcXGRcXGQkLykpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zZm9ybVN0cmVhbS5lbWl0KFxuICAgICAgICAgICdlcnJvcicsXG4gICAgICAgICAgRXJyb3JDb2RlLmdldEludGVybmFsRXJyb3IoYGJhZCBzdGF0dXMgY29kZSAke3Jlcy5zdGF0dXNDb2RlfSBmcm9tIHVwbGlua2ApXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcmVxdWVzdC9yZXF1ZXN0I3JlcXVlc3RvcHRpb25zLWNhbGxiYWNrXG4gICAgICAvLyBSZXF1ZXN0IGxpYnJhcnkgd2lsbCBub3QgZGVjb2RlIGd6aXAgc3RyZWFtLlxuICAgICAgbGV0IGpzb25TdHJlYW07XG4gICAgICBpZiAocmVzLmhlYWRlcnNbSEVBREVSX1RZUEUuQ09OVEVOVF9FTkNPRElOR10gPT09IEhFQURFUlMuR1pJUCkge1xuICAgICAgICBqc29uU3RyZWFtID0gcmVzLnBpcGUoemxpYi5jcmVhdGVVbnppcCgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGpzb25TdHJlYW0gPSByZXM7XG4gICAgICB9XG4gICAgICBqc29uU3RyZWFtLnBpcGUoSlNPTlN0cmVhbS5wYXJzZSgnKicpKS5vbignZGF0YScsIHBhcnNlUGFja2FnZSk7XG4gICAgICBqc29uU3RyZWFtLm9uKCdlbmQnLCAoKTogdm9pZCA9PiB7XG4gICAgICAgIHRyYW5zZm9ybVN0cmVhbS5lbWl0KCdlbmQnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmVxdWVzdFN0cmVhbS5vbignZXJyb3InLCAoZXJyOiBFcnJvcik6IHZvaWQgPT4ge1xuICAgICAgdHJhbnNmb3JtU3RyZWFtLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICB9KTtcblxuICAgIHRyYW5zZm9ybVN0cmVhbS5hYm9ydCA9ICgpOiB2b2lkID0+IHtcbiAgICAgIC8vIEZJWE1FOiB0aGlzIGlzIGNsZWFybHkgYSBwb3RlbnRpYWwgaXNzdWVcbiAgICAgIC8vIHRoZXJlIGlzIG5vIGFib3J0IG1ldGhvZCBvbiBTdHJlYW0uUmVhZGFibGVcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHJlcXVlc3RTdHJlYW0uYWJvcnQoKTtcbiAgICAgIHRyYW5zZm9ybVN0cmVhbS5lbWl0KCdlbmQnKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRyYW5zZm9ybVN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgcHJveHkgaGVhZGVycy5cbiAgICogRklYTUU6IG9iamVjdCBtdXRhdGlvbnMsIGl0IHNob3VsZCByZXR1cm4gYW4gbmV3IG9iamVjdFxuICAgKiBAcGFyYW0geyp9IHJlcSB0aGUgaHR0cCByZXF1ZXN0XG4gICAqIEBwYXJhbSB7Kn0gaGVhZGVycyB0aGUgcmVxdWVzdCBoZWFkZXJzXG4gICAqL1xuICBwcml2YXRlIF9hZGRQcm94eUhlYWRlcnMocmVxOiBhbnksIGhlYWRlcnM6IGFueSk6IHZvaWQge1xuICAgIGlmIChyZXEpIHtcbiAgICAgIC8vIE9ubHkgc3VibWl0IFgtRm9yd2FyZGVkLUZvciBmaWVsZCBpZiB3ZSBkb24ndCBoYXZlIGEgcHJveHkgc2VsZWN0ZWRcbiAgICAgIC8vIGluIHRoZSBjb25maWcgZmlsZS5cbiAgICAgIC8vXG4gICAgICAvLyBPdGhlcndpc2UgbWlzY29uZmlndXJlZCBwcm94eSBjb3VsZCByZXR1cm4gNDA3OlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JsaWR3a2Evc2lub3BpYS9pc3N1ZXMvMjU0XG4gICAgICAvL1xuICAgICAgLy8gRklYTUU6IHByb3h5IGxvZ2ljIGlzIG9kZCwgc29tZXRoaW5nIGlzIHdyb25nIGhlcmUuXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBpZiAoIXRoaXMucHJveHkpIHtcbiAgICAgICAgaGVhZGVyc1sneC1mb3J3YXJkZWQtZm9yJ10gPVxuICAgICAgICAgIChyZXEuZ2V0KCd4LWZvcndhcmRlZC1mb3InKSA/IHJlcS5nZXQoJ3gtZm9yd2FyZGVkLWZvcicpICsgJywgJyA6ICcnKSArXG4gICAgICAgICAgcmVxLmNvbm5lY3Rpb24ucmVtb3RlQWRkcmVzcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhbHdheXMgYXR0YWNoIFZpYSBoZWFkZXIgdG8gYXZvaWQgbG9vcHMsIGV2ZW4gaWYgd2UncmUgbm90IHByb3h5aW5nXG4gICAgaGVhZGVyc1sndmlhJ10gPSByZXEgJiYgcmVxLmdldCgndmlhJykgPyByZXEuZ2V0KCd2aWEnKSArICcsICcgOiAnJztcblxuICAgIGhlYWRlcnNbJ3ZpYSddICs9ICcxLjEgJyArIHRoaXMuc2VydmVyX2lkICsgJyAoVmVyZGFjY2lvKSc7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGUgcmVtb3RlIGhvc3QgaXMgYXZhaWxhYmxlLlxuICAgKiBAcGFyYW0geyp9IGFsaXZlXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuICBwcml2YXRlIF9zdGF0dXNDaGVjayhhbGl2ZT86IGJvb2xlYW4pOiBib29sZWFuIHwgdm9pZCB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9pZlJlcXVlc3RGYWlsdXJlKCkgPT09IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoYWxpdmUpIHtcbiAgICAgIGlmICh0aGlzLmZhaWxlZF9yZXF1ZXN0cyA+PSB0aGlzLm1heF9mYWlscykge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGhvc3Q6IHRoaXMudXJsLmhvc3QsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAnaG9zdCBAe2hvc3R9IGlzIGJhY2sgb25saW5lJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5mYWlsZWRfcmVxdWVzdHMgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZhaWxlZF9yZXF1ZXN0cysrO1xuICAgICAgaWYgKHRoaXMuZmFpbGVkX3JlcXVlc3RzID09PSB0aGlzLm1heF9mYWlscykge1xuICAgICAgICB0aGlzLmxvZ2dlci53YXJuKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGhvc3Q6IHRoaXMudXJsLmhvc3QsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAnaG9zdCBAe2hvc3R9IGlzIG5vdyBvZmZsaW5lJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubGFzdF9yZXF1ZXN0X3RpbWUgPSBEYXRlLm5vdygpO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSByZXF1ZXN0IGZhaWx1cmUuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9pZlJlcXVlc3RGYWlsdXJlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLmZhaWxlZF9yZXF1ZXN0cyA+PSB0aGlzLm1heF9mYWlscyAmJlxuICAgICAgTWF0aC5hYnMoRGF0ZS5ub3coKSAtICh0aGlzLmxhc3RfcmVxdWVzdF90aW1lIGFzIG51bWJlcikpIDwgdGhpcy5mYWlsX3RpbWVvdXRcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB1cCBhIHByb3h5LlxuICAgKiBAcGFyYW0geyp9IGhvc3RuYW1lXG4gICAqIEBwYXJhbSB7Kn0gY29uZmlnXG4gICAqIEBwYXJhbSB7Kn0gbWFpbmNvbmZpZ1xuICAgKiBAcGFyYW0geyp9IGlzSFRUUFNcbiAgICovXG4gIHByaXZhdGUgX3NldHVwUHJveHkoXG4gICAgaG9zdG5hbWU6IHN0cmluZyxcbiAgICBjb25maWc6IFVwTGlua0NvbmYsXG4gICAgbWFpbmNvbmZpZzogQ29uZmlnLFxuICAgIGlzSFRUUFM6IGJvb2xlYW5cbiAgKTogdm9pZCB7XG4gICAgbGV0IG5vUHJveHlMaXN0O1xuICAgIGNvbnN0IHByb3h5X2tleTogc3RyaW5nID0gaXNIVFRQUyA/ICdodHRwc19wcm94eScgOiAnaHR0cF9wcm94eSc7XG5cbiAgICAvLyBnZXQgaHR0cF9wcm94eSBhbmQgbm9fcHJveHkgY29uZmlnc1xuICAgIGlmIChwcm94eV9rZXkgaW4gY29uZmlnKSB7XG4gICAgICB0aGlzLnByb3h5ID0gY29uZmlnW3Byb3h5X2tleV07XG4gICAgfSBlbHNlIGlmIChwcm94eV9rZXkgaW4gbWFpbmNvbmZpZykge1xuICAgICAgdGhpcy5wcm94eSA9IG1haW5jb25maWdbcHJveHlfa2V5XTtcbiAgICB9XG4gICAgaWYgKCdub19wcm94eScgaW4gY29uZmlnKSB7XG4gICAgICBub1Byb3h5TGlzdCA9IGNvbmZpZy5ub19wcm94eTtcbiAgICB9IGVsc2UgaWYgKCdub19wcm94eScgaW4gbWFpbmNvbmZpZykge1xuICAgICAgbm9Qcm94eUxpc3QgPSBtYWluY29uZmlnLm5vX3Byb3h5O1xuICAgIH1cblxuICAgIC8vIHVzZSB3Z2V0LWxpa2UgYWxnb3JpdGhtIHRvIGRldGVybWluZSBpZiBwcm94eSBzaG91bGRuJ3QgYmUgdXNlZFxuICAgIGlmIChob3N0bmFtZVswXSAhPT0gJy4nKSB7XG4gICAgICBob3N0bmFtZSA9ICcuJyArIGhvc3RuYW1lO1xuICAgIH1cblxuICAgIGlmIChfLmlzU3RyaW5nKG5vUHJveHlMaXN0KSAmJiBub1Byb3h5TGlzdC5sZW5ndGgpIHtcbiAgICAgIG5vUHJveHlMaXN0ID0gbm9Qcm94eUxpc3Quc3BsaXQoJywnKTtcbiAgICB9XG5cbiAgICBpZiAoXy5pc0FycmF5KG5vUHJveHlMaXN0KSkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub1Byb3h5TGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgbm9Qcm94eUl0ZW0gPSBub1Byb3h5TGlzdFtpXTtcbiAgICAgICAgaWYgKG5vUHJveHlJdGVtWzBdICE9PSAnLicpIHtcbiAgICAgICAgICBub1Byb3h5SXRlbSA9ICcuJyArIG5vUHJveHlJdGVtO1xuICAgICAgICB9XG4gICAgICAgIGlmIChob3N0bmFtZS5sYXN0SW5kZXhPZihub1Byb3h5SXRlbSkgPT09IGhvc3RuYW1lLmxlbmd0aCAtIG5vUHJveHlJdGVtLmxlbmd0aCkge1xuICAgICAgICAgIGlmICh0aGlzLnByb3h5KSB7XG4gICAgICAgICAgICBkZWJ1Zygnbm90IHVzaW5nIHByb3h5IGZvciAlbywgZXhjbHVkZWQgYnkgJW8gcnVsZScsIHRoaXMudXJsLmhyZWYsIG5vUHJveHlJdGVtKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRoaXMucHJveHkgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiBpdCdzIG5vbi1zdHJpbmcgKGkuZS4gXCJmYWxzZVwiKSwgZG9uJ3QgdXNlIGl0XG4gICAgaWYgKF8uaXNTdHJpbmcodGhpcy5wcm94eSkgPT09IGZhbHNlKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBkZWxldGUgdGhpcy5wcm94eTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWcoJ3VzaW5nIHByb3h5ICVvIGZvciAlbycsIHRoaXMudXJsLmhyZWYsIHRoaXMucHJveHkpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQcm94eVN0b3JhZ2U7XG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUFBLFFBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFdBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLE1B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