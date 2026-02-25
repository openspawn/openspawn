"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Codes = void 0;
exports.emit = emit;
var _processWarning = _interopRequireDefault(require("process-warning"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const warningInstance = (0, _processWarning.default)();
const verdaccioWarning = 'VerdaccioWarning';
const verdaccioDeprecation = 'VerdaccioDeprecation';
let Codes = exports.Codes = /*#__PURE__*/function (Codes) {
  Codes["VERWAR001"] = "VERWAR001";
  Codes["VERWAR002"] = "VERWAR002";
  Codes["VERWAR003"] = "VERWAR003";
  Codes["VERWAR004"] = "VERWAR004";
  Codes["VERDEP003"] = "VERDEP003";
  Codes["VERWAR006"] = "VERWAR006";
  Codes["VERWAR007"] = "VERWAR007";
  return Codes;
}({});
/* general warnings */
warningInstance.create(verdaccioWarning, Codes.VERWAR001, `Verdaccio doesn't need superuser privileges. don't run it under root`);
warningInstance.create(verdaccioWarning, Codes.VERWAR002, `The configuration property "logs" has been deprecated, please rename to "log" for future compatibility`);
warningInstance.create(verdaccioWarning, Codes.VERWAR003, 'rotating-file type is not longer supported, consider use [logrotate] instead');
warningInstance.create(verdaccioWarning, Codes.VERWAR004, `invalid address - %s, we expect a port (e.g. "4873"), 
host:port (e.g. "localhost:4873") or full url '(e.g. "http://localhost:4873/")
https://verdaccio.org/docs/en/configuration#listen-port`);
warningInstance.create(verdaccioDeprecation, Codes.VERWAR006, 'the auth plugin method "add_user" in the auth plugin is deprecated and will be removed in next major release, rename to "adduser"');
warningInstance.create(verdaccioDeprecation, Codes.VERWAR007, `the secret length is too long, it must be 32 characters long, please consider generate a new one 
  Learn more at https://verdaccio.org/docs/configuration/#.verdaccio-db`);

/* deprecation warnings */

warningInstance.create(verdaccioDeprecation, Codes.VERDEP003, 'multiple addresses will be deprecated in the next major, only use one');
function emit(code, a, b, c) {
  warningInstance.emit(code, a, b, c);
}
//# sourceMappingURL=warning-utils.js.map