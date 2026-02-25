"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseBasicPayload = parseBasicPayload;
/**
 *
 * @param credentials
 * @returns
 */
function parseBasicPayload(credentials) {
  const index = credentials.indexOf(':');
  if (index < 0) {
    return;
  }
  const user = credentials.slice(0, index);
  const password = credentials.slice(index + 1);
  return {
    user,
    password
  };
}
//# sourceMappingURL=token.js.map