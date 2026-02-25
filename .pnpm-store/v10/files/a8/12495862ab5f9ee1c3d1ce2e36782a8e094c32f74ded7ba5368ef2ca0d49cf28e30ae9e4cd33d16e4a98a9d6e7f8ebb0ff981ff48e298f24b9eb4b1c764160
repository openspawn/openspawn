"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PLUGIN_NAME = 'CollectSharedEntryPlugin';
function inferPkgVersionFromResource(resource) {
    try {
        const nmIndex = resource.lastIndexOf('node_modules');
        if (nmIndex === -1) {
            return undefined;
        }
        const after = resource.substring(nmIndex + 'node_modules'.length + 1);
        // pnpm layout: node_modules/.pnpm/<encoded@version>/node_modules/<pkg>/...
        if (after.startsWith('.pnpm/')) {
            const m = after.match(/\.pnpm\/(?:[^/]+)@([^/]+)\/node_modules\//);
            if (m && m[1]) {
                return m[1];
            }
        }
        const parts = after.split(/[\\/]+/).filter(Boolean);
        if (!parts.length) {
            return undefined;
        }
        let pkgPathParts;
        if (parts[0].startsWith('@') && parts.length >= 2) {
            pkgPathParts = [parts[0], parts[1]];
        }
        else {
            pkgPathParts = [parts[0]];
        }
        const nmBase = resource.substring(0, nmIndex + 'node_modules'.length + 1);
        const pkgJsonPath = path.join(nmBase, ...pkgPathParts, 'package.json');
        try {
            const content = fs.readFileSync(pkgJsonPath, 'utf-8');
            const pkg = JSON.parse(content);
            const v = pkg?.version;
            if (typeof v === 'string' && v) {
                return v;
            }
        }
        catch {
            // ignore
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
class CollectSharedEntryPlugin {
    constructor(options) {
        this.name = PLUGIN_NAME;
        this.name = PLUGIN_NAME;
        const { sharedOptions } = options;
        this.sharedOptions = sharedOptions;
        this._collectedEntries = {};
    }
    getData() {
        return this._collectedEntries;
    }
    apply(compiler) {
        const { sharedOptions } = this;
        const { _collectedEntries: collectedEntries } = this;
        compiler.hooks.compilation.tap('CollectSharedEntryPlugin', (_compilation, { normalModuleFactory }) => {
            normalModuleFactory.hooks.module.tap('CollectSharedEntryPlugin', (module, { resource }, resolveData) => {
                if (!resource || !('rawRequest' in module)) {
                    return module;
                }
                const matchedSharedOption = sharedOptions.find((item) => item[0] === module.rawRequest);
                if (!matchedSharedOption) {
                    return module;
                }
                const [sharedName, _] = matchedSharedOption;
                const sharedVersion = inferPkgVersionFromResource(resource);
                if (!sharedVersion) {
                    return module;
                }
                collectedEntries[sharedName] ||= { requests: [] };
                collectedEntries[sharedName].requests.push([
                    resource,
                    sharedVersion,
                ]);
                return module;
            });
        });
        compiler.hooks.thisCompilation.tap('Collect shared entry', (compilation) => {
            compilation.hooks.processAssets.tapPromise({
                name: 'CollectSharedEntry',
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
            }, async () => {
                compilation.getAssets().forEach((asset) => {
                    compilation.deleteAsset(asset.name);
                });
            });
        });
    }
}
exports.default = CollectSharedEntryPlugin;
//# sourceMappingURL=CollectSharedEntryPlugin.js.map