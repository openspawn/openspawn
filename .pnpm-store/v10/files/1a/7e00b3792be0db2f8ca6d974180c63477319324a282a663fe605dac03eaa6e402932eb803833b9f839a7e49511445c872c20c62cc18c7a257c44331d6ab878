"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NxAppWebpackPlugin = void 0;
const normalize_options_1 = require("./lib/normalize-options");
const apply_base_config_1 = require("./lib/apply-base-config");
const apply_web_config_1 = require("./lib/apply-web-config");
/**
 * This plugin provides features to build Node and Web applications.
 * - TS support (including tsconfig paths)
 * - Different compiler options
 * - Assets handling
 * - Stylesheets handling
 * - index.html and package.json generation
 *
 * Web-only features, such as stylesheets and images, are only supported when `target` is 'web' or 'webworker'.
 */
class NxAppWebpackPlugin {
    constructor(options = {}) {
        // If we're building inferred targets, skip normalizing build options.
        if (!global.NX_GRAPH_CREATION) {
            this.options = (0, normalize_options_1.normalizeOptions)(options);
        }
    }
    apply(compiler) {
        // Defaults to 'web' if not specified to match Webpack's default.
        const target = this.options.target ?? compiler.options.target ?? 'web';
        this.options.outputPath ??= compiler.options.output?.path;
        if (typeof target === 'string') {
            this.options.target = target;
        }
        (0, apply_base_config_1.applyBaseConfig)(this.options, compiler.options, {
            useNormalizedEntry: true,
        });
        if (compiler.options.target) {
            this.options.target = compiler.options.target;
        }
        if (this.options.target === 'web' || this.options.target === 'webworker') {
            (0, apply_web_config_1.applyWebConfig)(this.options, compiler.options, {
                useNormalizedEntry: true,
            });
        }
    }
}
exports.NxAppWebpackPlugin = NxAppWebpackPlugin;
