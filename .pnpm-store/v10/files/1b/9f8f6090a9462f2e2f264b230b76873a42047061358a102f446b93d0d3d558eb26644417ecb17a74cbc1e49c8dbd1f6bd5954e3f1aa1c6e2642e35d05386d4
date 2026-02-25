"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleError = exports.errorReportingMiddleware = void 0;
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:middleware:error');
const handleError = logger => function handleError(err, req, res, next) {
  debug('error handler init');
  if (_lodash.default.isError(err)) {
    debug('is native error');
    if (err.code === 'ECONNABORT' && res.statusCode === _core.HTTP_STATUS.NOT_MODIFIED) {
      return next();
    }
    if (_lodash.default.isFunction(res.locals.report_error) === false) {
      debug('is locals error report ref');
      // in case of very early error this middleware may not be loaded before error is generated
      // fixing that
      errorReportingMiddleware(logger)(req, res, _lodash.default.noop);
    }
    debug('set locals error report ref');
    res.locals.report_error(err);
  } else {
    // Fall to Middleware.final
    debug('no error to report, jump next layer');
    return next(err);
  }
};

// Middleware
exports.handleError = handleError;
const errorReportingMiddleware = logger => function errorReportingMiddleware(req, res, next) {
  debug('error report middleware start');
  res.locals.report_error = res.locals.report_error || function (err) {
    if (err.status && err.status >= _core.HTTP_STATUS.BAD_REQUEST && err.status < 600) {
      debug('is error > 409 %o', err?.status);
      if (_lodash.default.isNil(res.headersSent) === false) {
        debug('send status %o', err?.status);
        res.status(err.status);
        debug('next layer %o', err?.message);
        next({
          error: err.message || _core.API_ERROR.UNKNOWN_ERROR
        });
      }
    } else {
      debug('is error < 409 %o', err?.status);
      logger.error({
        err: err
      }, 'unexpected error: @{!err.message}\n@{err.stack}');
      if (!res.status || !res.send) {
        // TODO: decide which debug keep
        logger.error('this is an error in express.js, please report this');
        debug('this is an error in express.js, please report this, destroy response %o', err);
        res.destroy();
      } else if (!res.headersSent) {
        debug('send internal error %o', err);
        res.status(_core.HTTP_STATUS.INTERNAL_ERROR);
        next({
          error: _core.API_ERROR.INTERNAL_SERVER_ERROR
        });
      } else {
        // socket should be already closed
        debug('this should not happen, otherwise report %o', err);
      }
    }
  };
  debug('error report middleware end (skip next layer) next()');
  next();
};
exports.errorReportingMiddleware = errorReportingMiddleware;
//# sourceMappingURL=error.js.map