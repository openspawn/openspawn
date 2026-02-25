"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildPretty = buildPretty;
exports.default = _default;
Object.defineProperty(exports, "fillInMsgTemplate", {
  enumerable: true,
  get: function () {
    return _formatter.fillInMsgTemplate;
  }
});
exports.hasColors = hasColors;
var _colorette = require("colorette");
var _nodeStream = require("node:stream");
var _nodeWorker_threads = require("node:worker_threads");
var _pinoAbstractTransport = _interopRequireDefault(require("pino-abstract-transport"));
var _sonicBoom = _interopRequireDefault(require("sonic-boom"));
var _formatter = require("./formatter");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function noop() {}

/**
 * Creates a safe SonicBoom instance
 *
 * @param {object} opts Options for SonicBoom
 *
 * @returns {object} A new SonicBoom stream
 */
function buildSafeSonicBoom(opts) {
  const stream = new _sonicBoom.default(opts);
  stream.on('error', filterBrokenPipe);
  if (!opts.sync && _nodeWorker_threads.isMainThread) {
    setupOnExit(stream);
  }
  return stream;
  function filterBrokenPipe(err) {
    if (err.code === 'EPIPE') {
      // @ts-ignore
      stream.write = noop;
      stream.end = noop;
      stream.flushSync = noop;
      stream.destroy = noop;
      return;
    }
    stream.removeListener('error', filterBrokenPipe);
  }
}
function setupOnExit(stream) {
  /* istanbul ignore next */
  if (global.WeakRef && global.WeakMap && global.FinalizationRegistry) {
    // This is leak free, it does not leave event handlers
    const onExit = require('on-exit-leak-free');
    onExit.register(stream, autoEnd);
    stream.on('close', function () {
      onExit.unregister(stream);
    });
  }
}

/* istanbul ignore next */
function autoEnd(stream, eventName) {
  // This check is needed only on some platforms

  if (stream.destroyed) {
    return;
  }
  if (eventName === 'beforeExit') {
    // We still have an event loop, let's use it
    stream.flush();
    stream.on('drain', function () {
      stream.end();
    });
  } else {
    // We do not have an event loop, so flush synchronously
    stream.flushSync();
  }
}
function hasColors(colors) {
  if (colors) {
    return _colorette.isColorSupported;
  }
  return typeof colors === 'undefined' ? true : colors;
}
function buildPretty(opts) {
  return chunk => {
    const colors = hasColors(opts.colors);
    return (0, _formatter.printMessage)(chunk, {
      prettyStamp: opts.prettyStamp
    }, colors);
  };
}
function _default(opts) {
  const pretty = buildPretty(opts);
  // @ts-ignore
  return (0, _pinoAbstractTransport.default)(function (source) {
    const stream = new _nodeStream.Transform({
      objectMode: true,
      autoDestroy: true,
      transform(chunk, enc, cb) {
        const line = pretty(chunk) + '\n';
        cb(null, line);
      }
    });
    const destination = buildSafeSonicBoom({
      dest: opts.destination || 1,
      sync: opts.sync || true
    });
    source.on('unknown', function (line) {
      destination.write(line + '\n');
    });
    (0, _nodeStream.pipeline)(source, stream, destination, err => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('prettify pipeline error ', err);
      }
    });
    return stream;
  });
}
//# sourceMappingURL=prettify.js.map