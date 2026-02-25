"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.allow = allow;
var _debug = _interopRequireDefault(require("debug"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:middleware:allow');
function allow(auth, options = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  beforeAll: (_a, _b) => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  afterAll: (_a, _b) => {}
}) {
  const {
    beforeAll,
    afterAll
  } = options;
  return function (action) {
    return function (req, res, next) {
      req.pause();
      const packageName = req.params.scope ? `${req.params.scope}/${req.params.package}` : req.params.package;
      const packageVersion = req.params.filename ? _core.tarballUtils.getVersionFromTarball(req.params.filename) : req.params.version ? req.params.version : undefined;
      const remote_user = req.remote_user;
      debug('check if user %o can %o package %o version %o', remote_user?.name, action, packageName, packageVersion);
      beforeAll?.({
        action,
        user: remote_user?.name
      }, `[middleware/allow][@{action}] allow for @{user}`);
      auth['allow_' + action]({
        packageName,
        packageVersion
      }, remote_user, function (error, allowed) {
        req.resume();
        if (error) {
          debug('user is NOT allowed to %o', action);
          next(error);
        } else if (allowed) {
          debug('user is allowed to %o', action);
          afterAll?.({
            action,
            user: remote_user?.name
          }, `[middleware/allow][@{action}] allowed for @{user}`);
          next();
        } else {
          // last plugin (that's our built-in one) returns either
          // cb(err) or cb(null, true), so this should never happen
          throw _core.errorUtils.getInternalError(_core.API_ERROR.PLUGIN_ERROR);
        }
      });
    };
  };
}
//# sourceMappingURL=allow.js.map