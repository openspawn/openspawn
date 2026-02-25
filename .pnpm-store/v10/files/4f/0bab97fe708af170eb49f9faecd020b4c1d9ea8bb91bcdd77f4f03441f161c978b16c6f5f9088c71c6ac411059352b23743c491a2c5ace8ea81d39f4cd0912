"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getListenAddress = getListenAddress;
exports.parseAddress = parseAddress;
var _debug = _interopRequireDefault(require("debug"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:config:address');
/**
 * Parse an internet address
 * Allow:
 - https:localhost:1234        - protocol + host + port
 - localhost:1234              - host + port
 - 1234                        - port
 - http::1234                  - protocol + port
 - https://localhost:443/      - full url + https
 - http://[::1]:443/           - ipv6
 - unix:/tmp/http.sock         - unix sockets
 - https://unix:/tmp/http.sock - unix sockets (https)
 * @param {*} urlAddress the internet address definition
 * @return {Object|Null} literal object that represent the address parsed
 */
function parseAddress(urlAddress) {
  //
  // TODO: refactor it to something more reasonable?
  //
  //        protocol :  //      (  host  )|(    ipv6     ):  port  /
  const urlPattern = /^((https?):(\/\/)?)?((([^\/:]*)|\[([^\[\]]+)\]):)?(\d+)\/?$/.exec(urlAddress);
  if (urlPattern) {
    return {
      proto: urlPattern[2] || _core.DEFAULT_PROTOCOL,
      host: urlPattern[6] || urlPattern[7] || _core.DEFAULT_DOMAIN,
      port: urlPattern[8] || _core.DEFAULT_PORT
    };
  }
  const unixPattern = /^(?:(https?):\/\/)?unix:(\/.*)$/.exec(urlAddress);
  if (!unixPattern) {
    // if we cannot match the unix pattern, we return null
    // this is to avoid returning a wrong object
    return null;
  }
  return {
    host: unixPattern[2],
    proto: unixPattern[1] || 'unix',
    path: unixPattern[2]
  };
}
function addrToString(a) {
  return a.proto === 'unix' ? `unix:${a.host}` : `${a.proto}://${a.host}:${a.port}`;
}

/**
 * Retrieve all addresses defined in the config file.
 * Verdaccio is able to listen multiple ports
 * @param {String} argListen
 * @param {String} configListen
 * eg:
 *  listen:
 - localhost:5555
 - localhost:5557
 @return {Array}
 */
function getListenAddress(listen, logger) {
  debug('getListenAddress called with %o', listen);
  if (!listen) {
    debug('No listen address provided, using default');
    return {
      proto: _core.DEFAULT_PROTOCOL,
      host: _core.DEFAULT_DOMAIN,
      port: _core.DEFAULT_PORT
    };
  }
  if (Array.isArray(listen)) {
    const filteredListen = listen.filter(item => typeof item === 'string');
    if (filteredListen.length === 0) {
      throw new Error('Listen addresses array cannot be empty');
    }
    const invalid = [];
    const valid = [];
    for (const raw of filteredListen) {
      const candidate = parseAddress(raw);
      if (candidate) {
        debug('valid listen address found: %o', candidate);
        valid.push(candidate);
      } else {
        debug('invalid address found: %o', raw);
        invalid.push(raw);
      }
    }
    invalid.forEach(bad => logger.warn({
      addr: bad
    }, 'invalid address - @{addr}, we expect a port (e.g. "4873"), ' + 'host:port (e.g. "localhost:4873"), full url ' + '(e.g. "http://localhost:4873/") or unix:/path/socket'));
    if (valid.length === 0) {
      throw new Error('No valid listen addresses found in configuration array');
    }
    const firstValid = valid[0];
    if (listen.length > 1) {
      logger.warn(`Multiple listen addresses are not supported, using the first valid one ${addrToString(firstValid)}`);
    }
    return firstValid;
  }
  const single = parseAddress(listen);
  if (!single) {
    throw new Error(`Invalid address - ${listen}, we expect a port (e.g. "4873"), ` + `host:port (e.g. "localhost:4873"), full url ` + `(e.g. "http://localhost:4873/") or unix:/path/socket`);
  }
  return single;
}
//# sourceMappingURL=address.js.map