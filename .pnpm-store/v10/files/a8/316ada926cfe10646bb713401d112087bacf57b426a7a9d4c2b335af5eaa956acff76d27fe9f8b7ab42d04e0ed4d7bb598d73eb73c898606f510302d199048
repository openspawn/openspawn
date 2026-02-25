"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = renderTemplate;
var _debug = _interopRequireDefault(require("debug"));
var _manifest = require("./manifest");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = (0, _debug.default)('verdaccio:web:render:template');

// the outcome of the Webpack Manifest Plugin

function renderTemplate(template, manifest) {
  debug('template %o', template);
  debug('manifest %o', manifest);
  return `
    <!DOCTYPE html>
      <html lang="en-us">
      <head>
        <meta charset="utf-8">
        <base href="${template?.options.base}">
        <title>${template?.options?.title ?? ''}</title>
        <link rel="icon" href="${template?.options.base}-/static/favicon.ico">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
            window.__VERDACCIO_BASENAME_UI_OPTIONS=${JSON.stringify(template.options)}
        </script>
        ${template?.metaScripts ? template.metaScripts.join('') : ''}
      </head>
      <body class="body">
        ${template?.scriptsBodyBefore ? template.scriptsBodyBefore.join('') : ''}
        <div id="root"></div>
        ${(0, _manifest.getManifestValue)(template.manifest.js, manifest, template?.options.base).map(item => `<script defer="defer" src="${item}"></script>`).join(`\n        `)}
        ${template?.scriptsBodyAfter ? template.scriptsBodyAfter.join('') : ''}
      </body>
    </html>
  `;
}
//# sourceMappingURL=template.js.map