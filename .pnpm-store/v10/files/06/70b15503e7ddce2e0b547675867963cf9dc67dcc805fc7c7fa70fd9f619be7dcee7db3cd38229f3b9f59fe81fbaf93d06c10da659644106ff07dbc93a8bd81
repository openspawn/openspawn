"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FORMAT_DATE = exports.CUSTOM_PAD_LENGTH = void 0;
exports.formatLoggingDate = formatLoggingDate;
exports.isObject = isObject;
exports.padRight = padRight;
var _dayjs = _interopRequireDefault(require("dayjs"));
var _lodash = _interopRequireDefault(require("lodash"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const FORMAT_DATE = exports.FORMAT_DATE = 'YYYY-MM-DD HH:mm:ss';
const CUSTOM_PAD_LENGTH = exports.CUSTOM_PAD_LENGTH = 1;
function isObject(obj) {
  return _lodash.default.isObject(obj) && _lodash.default.isNull(obj) === false && _lodash.default.isArray(obj) === false;
}
function padRight(message, max = message.length + CUSTOM_PAD_LENGTH) {
  return message.padEnd(max, ' ');
}
function formatLoggingDate(time, message) {
  const timeFormatted = (0, _dayjs.default)(time).format(FORMAT_DATE);
  return `[${timeFormatted}] ${message}`;
}
//# sourceMappingURL=utils.js.map