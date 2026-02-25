"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultSecurity = exports.TIME_EXPIRATION_1H = void 0;
// TODO: get this from core package
const TIME_EXPIRATION_1H = exports.TIME_EXPIRATION_1H = '1h';
const defaultWebTokenOptions = {
  sign: {
    // The expiration token for the website is 7 days
    expiresIn: TIME_EXPIRATION_1H
  },
  verify: {}
};
const defaultApiTokenConf = {
  legacy: true,
  migrateToSecureLegacySignature: true
};
const defaultSecurity = exports.defaultSecurity = {
  web: defaultWebTokenOptions,
  api: defaultApiTokenConf
};
//# sourceMappingURL=security.js.map