"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.REGISTRY_DOMAIN = void 0;
var _express = _interopRequireDefault(require("express"));
var _httpsProxyAgent = _interopRequireDefault(require("https-proxy-agent"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _nodeHttps = _interopRequireDefault(require("node:https"));
var _core = require("@verdaccio/core");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// FUTURE: we should be able to overwrite this
const REGISTRY_DOMAIN = exports.REGISTRY_DOMAIN = 'https://registry.npmjs.org';
class ProxyAudit extends _core.pluginUtils.Plugin {
  constructor(config, options) {
    super(config, options);
    this.enabled = config.enabled || false;
    this.strict_ssl = config.strict_ssl !== undefined ? config.strict_ssl : true;
    this.timeout = config.timeout ?? 1000 * 60 * 1;
    this.logger = options.logger;
  }
  register_middlewares(app, auth) {
    const fetchAudit = async (req, res) => {
      const headers = req.headers;
      headers['host'] = 'registry.npmjs.org';
      headers['content-encoding'] = 'gzip,deflate,br';
      let requestOptions = {
        agent: new _nodeHttps.default.Agent({
          rejectUnauthorized: this.strict_ssl
        }),
        body: JSON.stringify(req.body),
        headers,
        method: req.method
      };
      if (auth?.config?.https_proxy) {
        // we should check whether this works fine after this migration
        // please notify if anyone is having issues
        const agent = (0, _httpsProxyAgent.default)(auth?.config?.https_proxy);
        requestOptions = Object.assign({}, requestOptions, {
          agent
        });
      }
      try {
        const auditEndpoint = `${REGISTRY_DOMAIN}${req.baseUrl}${req.route.path}`;
        this.logger.debug('fetching audit from ' + auditEndpoint);
        const controller = new AbortController();
        setTimeout(() => controller.abort(`Fetch ${auditEndpoint} timeout ${this.timeout}ms`), this.timeout);
        const response = await (0, _nodeFetch.default)(auditEndpoint, {
          ...requestOptions,
          signal: controller.signal
        });
        if (response.ok) {
          res.status(response.status).send(await response.json());
        } else {
          this.logger.warn('could not fetch audit: ' + JSON.stringify(await response.json()));
          res.status(response.status).end();
        }
      } catch (error) {
        this.logger.warn('could not fetch audit: ' + error);
        res.status(500).end();
      }
    };
    const handleAudit = async (req, res) => {
      if (this.enabled) {
        await fetchAudit(req, res);
      } else {
        res.status(500).end();
      }
    };

    /* eslint new-cap:off */
    const router = _express.default.Router();
    /* eslint new-cap:off */

    router.post('/audits', _express.default.json({
      limit: '10mb'
    }), handleAudit);
    router.post('/audits/quick', _express.default.json({
      limit: '10mb'
    }), handleAudit);
    router.post('/advisories/bulk', _express.default.json({
      limit: '10mb'
    }), handleAudit);
    app.use('/-/npm/v1/security', router);
  }
}
exports.default = ProxyAudit;
//# sourceMappingURL=audit.js.map