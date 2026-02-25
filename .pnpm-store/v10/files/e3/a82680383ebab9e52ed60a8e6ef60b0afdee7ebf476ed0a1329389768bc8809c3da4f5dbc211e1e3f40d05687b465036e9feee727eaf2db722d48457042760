"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UploadTarball = exports.ReadTarball = void 0;
var _stream = require("stream");
/**
 * This stream is used to read tarballs from repository.
 * @param {*} options
 * @return {Stream}
 */
class ReadTarball extends _stream.PassThrough {
  /**
   *
   * @param {Object} options
   */
  constructor(options) {
    super(options);
    // called when data is not needed anymore
    addAbstractMethods(this, 'abort');
  }
  abort() {}
}

/**
 * This stream is used to upload tarballs to a repository.
 * @param {*} options
 * @return {Stream}
 */
exports.ReadTarball = ReadTarball;
class UploadTarball extends _stream.PassThrough {
  /**
   *
   * @param {Object} options
   */
  constructor(options) {
    super(options);
    // called when user closes connection before upload finishes
    addAbstractMethods(this, 'abort');

    // called when upload finishes successfully
    addAbstractMethods(this, 'done');
  }
  abort() {}
  done() {}
}

/**
 * This function intercepts abstract calls and replays them allowing.
 * us to attach those functions after we are ready to do so
 * @param {*} self
 * @param {*} name
 */
// Perhaps someone knows a better way to write this
exports.UploadTarball = UploadTarball;
function addAbstractMethods(self, name) {
  self._called_methods = self._called_methods || {};
  self.__defineGetter__(name, function () {
    return function () {
      self._called_methods[name] = true;
    };
  });
  self.__defineSetter__(name, function (fn) {
    delete self[name];
    self[name] = fn;
    if (self._called_methods && self._called_methods[name]) {
      delete self._called_methods[name];
      self[name]();
    }
  });
}
//# sourceMappingURL=index.js.map