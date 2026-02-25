"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformObjectToString = exports.readableToString = void 0;
var _nodeStream = require("node:stream");
/**
 * Converts a buffer stream to a string.
 */
const readableToString = async stream => {
  const chunks = [];
  for await (let chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);
  const str = buffer.toString('utf-8');
  return str;
};

/**
 * Transform stream object  mode to string
 **/
exports.readableToString = readableToString;
const transformObjectToString = () => {
  return new _nodeStream.Transform({
    objectMode: true,
    transform: (chunk, encoding, callback) => {
      callback(null, JSON.stringify(chunk));
    }
  });
};
exports.transformObjectToString = transformObjectToString;
//# sourceMappingURL=stream-utils.js.map