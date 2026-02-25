"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTarballDetails = getTarballDetails;
var _gunzipMaybe = _interopRequireDefault(require("gunzip-maybe"));
var _nodeStream = require("node:stream");
var tarStream = _interopRequireWildcard(require("tar-stream"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
async function getTarballDetails(buffer) {
  let fileCount = 0;
  let unpackedSize = 0;
  const readable = _nodeStream.Readable.from(buffer);
  const unpack = tarStream.extract();
  return new Promise((resolve, reject) => {
    readable.pipe((0, _gunzipMaybe.default)()).pipe(unpack).on('entry', (header, stream, next) => {
      fileCount++;
      unpackedSize += Number(header.size);
      stream.resume(); // important to ensure that "entry" events keep firing
      next();
    }).on('finish', () => {
      resolve({
        fileCount,
        unpackedSize
      });
    }).on('error', reject);
  });
}
//# sourceMappingURL=getTarballDetails.js.map