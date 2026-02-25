"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cache = void 0;
exports.formatNumber = formatNumber;
exports.formatNumberMaxPrecision = formatNumberMaxPrecision;
exports.getFormatter = getFormatter;
const cache = exports.cache = new Map();
function getFormatter(locale, options) {
  const optionsString = JSON.stringify({
    locale,
    options
  });
  const cachedFormatter = cache.get(optionsString);
  if (cachedFormatter) {
    return cachedFormatter;
  }
  const formatter = new Intl.NumberFormat(locale, options);
  cache.set(optionsString, formatter);
  return formatter;
}
function formatNumber(value, locale, options) {
  if (value == null) {
    return '';
  }
  return getFormatter(locale, options).format(value);
}
function formatNumberMaxPrecision(value, locale, options) {
  return formatNumber(value, locale, {
    ...options,
    maximumFractionDigits: 20
  });
}