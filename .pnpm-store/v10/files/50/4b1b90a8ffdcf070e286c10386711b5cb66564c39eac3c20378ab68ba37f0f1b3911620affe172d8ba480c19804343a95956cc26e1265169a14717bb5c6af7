"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lodash = require("lodash");
var _ = require(".");
/**
 * Helper configuration builder constructor, used to build the configuration for testing or
 * programatically creating a configuration.
 */
class ConfigBuilder {
  constructor(config) {
    this.config = (0, _lodash.merge)(config, {
      uplinks: {},
      packages: {},
      security: {}
    });
  }
  static build(config) {
    return new ConfigBuilder(config);
  }
  addPackageAccess(pattern, pkgAccess) {
    // @ts-ignore
    this.config.packages[pattern] = pkgAccess;
    return this;
  }
  addUplink(id, uplink) {
    this.config.uplinks[id] = uplink;
    return this;
  }
  addSecurity(security) {
    this.config.security = (0, _lodash.merge)(this.config.security, security);
    return this;
  }
  addAuth(auth) {
    this.config.auth = (0, _lodash.merge)(this.config.auth, auth);
    return this;
  }
  addLogger(log) {
    this.config.log = log;
    return this;
  }
  addStorage(storage) {
    if (typeof storage === 'string') {
      this.config.storage = storage;
    } else {
      this.config.store = storage;
    }
    return this;
  }
  getConfig() {
    return this.config;
  }
  getAsYaml() {
    return (0, _.fromJStoYAML)(this.config);
  }
}
exports.default = ConfigBuilder;
//# sourceMappingURL=builder.js.map