"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLogger = createLogger;
exports.logger = void 0;
exports.prepareSetup = prepareSetup;
exports.setup = setup;
var _colorette = require("colorette");
var _debug = _interopRequireDefault(require("debug"));
var _loggerPrettify = require("@verdaccio/logger-prettify");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// <reference types="node" />

const debug = (0, _debug.default)('verdaccio:logger');
function isProd() {
  return process.env.NODE_ENV === 'production';
}
function hasColors(colors) {
  if (colors) {
    return _colorette.isColorSupported;
  }
  return typeof colors === 'undefined' ? true : colors;
}
const DEFAULT_LOG_FORMAT = isProd() ? 'json' : 'pretty';
function createLogger(options = {
  level: 'http'
},
// eslint-disable-next-line no-undef
// @ts-ignore
destination = pino.destination(1), format = DEFAULT_LOG_FORMAT, pino) {
  debug('setup logger');
  let pinoConfig = {
    customLevels: {
      http: 25
    },
    level: options.level,
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res
    },
    sync: options.sync,
    redact: options.redact
  };
  debug('has prettifier? %o', !isProd());
  // pretty logs are not allowed in production for performance reasons
  if (['pretty-timestamped', 'pretty'].includes(format) && isProd() === false) {
    pinoConfig = Object.assign({}, pinoConfig, {
      transport: {
        target: '@verdaccio/logger-prettify',
        options: {
          // string or 1 (file descriptor for process.stdout)
          destination: options.path || 1,
          colors: hasColors(options.colors),
          prettyStamp: format === 'pretty-timestamped'
        }
      }
    });
  } else {
    pinoConfig = {
      ...pinoConfig,
      // more info
      // https://github.com/pinojs/pino/blob/v7.1.0/docs/api.md#hooks-object
      // TODO: improve typings here
      // @ts-ignore
      hooks: {
        logMethod(inputArgs, method) {
          const [templateObject, message, ...otherArgs] = inputArgs;
          const templateVars = !!templateObject && typeof templateObject === 'object' ? Object.getOwnPropertyNames(templateObject) : [];
          if (!message || !templateVars.length) return method.apply(this, inputArgs);
          const hydratedMessage = (0, _loggerPrettify.fillInMsgTemplate)(message, templateObject, false);
          return method.apply(this, [templateObject, hydratedMessage, ...otherArgs]);
        }
      }
    };
  }
  const logger = pino(pinoConfig, destination);

  /* eslint-disable */
  /* istanbul ignore next */
  if (process.env.DEBUG) {
    logger.on('level-change', (lvl, val, prevLvl, prevVal, instance) => {
      if (logger !== instance) {
        return;
      }
      debug('%s (%d) was changed to %s (%d)', lvl, val, prevLvl, prevVal);
    });
  }
  return logger;
}
const DEFAULT_LOGGER_CONF = {
  type: 'stdout',
  format: 'pretty',
  level: 'http'
};
function prepareSetup(options = DEFAULT_LOGGER_CONF, pino) {
  let logger;
  let loggerConfig = options;
  if (!loggerConfig?.level) {
    loggerConfig = Object.assign({}, {
      level: 'http'
    }, loggerConfig);
  }
  if (loggerConfig.type === 'file') {
    debug('logging file enabled');
    const destination = pino.destination(loggerConfig.path);
    /* eslint-disable */
    /* istanbul ignore next */
    process.on('SIGUSR2', () => destination.reopen());
    logger = createLogger(loggerConfig, destination, loggerConfig.format, pino);
    return logger;
  } else {
    debug('logging stdout enabled');
    logger = createLogger(loggerConfig, pino.destination(1), loggerConfig.format, pino);
    return logger;
  }
}
let logger = exports.logger = void 0;
function setup(options, pino) {
  if (typeof logger !== 'undefined') {
    return logger;
  }
  exports.logger = logger = prepareSetup(options, pino);
  return logger;
}
//# sourceMappingURL=logger.js.map