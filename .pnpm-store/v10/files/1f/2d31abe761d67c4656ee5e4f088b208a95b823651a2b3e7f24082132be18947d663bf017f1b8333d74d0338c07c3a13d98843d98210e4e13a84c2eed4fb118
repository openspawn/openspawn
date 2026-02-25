"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getByQualityPriorityValue = getByQualityPriorityValue;
/**
 * Quality values, or q-values and q-factors, are used to describe the order
 * of priority of values in a comma-separated list.
 * It is a special syntax allowed in some HTTP headers and in HTML.
 * https://developer.mozilla.org/en-US/docs/Glossary/Quality_values
 * @param headerValue
 */
function getByQualityPriorityValue(headerValue) {
  if (typeof headerValue !== 'string') {
    return '';
  }
  const split = headerValue.split(',');
  if (split.length <= 1) {
    const qList = split[0].split(';');
    return qList[0];
  }
  let [header] = split.reduce((acc, item) => {
    const qList = item.split(';');
    if (qList.length > 1) {
      const [accept, q] = qList;
      const [, query] = q.split('=');
      acc.push([accept.trim(), query ? query : 0]);
    } else {
      acc.push([qList[0], 0]);
    }
    return acc;
  }, []).sort(function (a, b) {
    return b[1] - a[1];
  });
  return header[0];
}
//# sourceMappingURL=string-utils.js.map