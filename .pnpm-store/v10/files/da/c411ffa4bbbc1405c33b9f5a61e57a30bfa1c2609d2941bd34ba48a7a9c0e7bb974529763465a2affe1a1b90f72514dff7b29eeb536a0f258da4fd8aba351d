'use strict';

var path = require('path');
var fs = require('fs-extra');
var sdk = require('@module-federation/sdk');
var normalizeWebpackPath = require('@module-federation/sdk/normalize-webpack-path');
var runtimeUtils = require('./runtime-utils.cjs.cjs');
var constant = require('./constant.cjs.cjs');

const TEMP_DIR = '.mf';

const fileExistsWithCaseSync = (filepath) => {
    const dir = path.dirname(filepath);
    if (filepath === '/' || filepath === '.') {
        return true;
    }
    const filenames = fs.readdirSync(dir);
    if (filenames.indexOf(path.basename(filepath)) === -1) {
        return false;
    }
    return fileExistsWithCaseSync(dir);
};
const fixPrefetchPath = (exposePath) => {
    const pathExt = ['.js', '.ts'];
    const extReg = /\.(ts|js|tsx|jsx)$/;
    if (extReg.test(exposePath)) {
        return pathExt.map((ext) => exposePath.replace(extReg, `.prefetch${ext}`));
    }
    else {
        return pathExt.map((ext) => exposePath + `.prefetch${ext}`);
    }
};

const { RuntimeGlobals, Template } = require(normalizeWebpackPath.normalizeWebpackPath('webpack'));
const createBundlerLogger = typeof sdk.createInfrastructureLogger === 'function'
    ? sdk.createInfrastructureLogger
    : sdk.createLogger;
const logger = createBundlerLogger('[ Module Federation Data Prefetch Plugin ]');
function getFederationGlobalScope(runtimeGlobals) {
    return `${runtimeGlobals.require || '__webpack_require__'}.federation`;
}
class PrefetchPlugin {
    constructor(options) {
        this.options = options;
        this._reWriteExports = '';
    }
    apply(compiler) {
        var _a;
        sdk.bindLoggerToCompiler(logger, compiler, 'PrefetchPlugin');
        const { name, exposes } = this.options;
        if (!exposes) {
            return;
        }
        if (!compiler.options.context) {
            throw new Error('compiler.options.context is not defined');
        }
        const { runtimePlugins } = this.options;
        if (!Array.isArray(runtimePlugins)) {
            this.options.runtimePlugins = [];
        }
        const runtimePath = path.resolve(__dirname, './plugin.esm.js');
        if (!((_a = this.options.runtimePlugins) === null || _a === void 0 ? void 0 : _a.includes(runtimePath))) {
            this.options.runtimePlugins.push(runtimePath);
        }
        if (this.options.shareStrategy !== constant.SHARED_STRATEGY) {
            this.options.shareStrategy = constant.SHARED_STRATEGY;
            logger.warn(`[Module Federation Data Prefetch]: Your shared strategy is set to '${constant.SHARED_STRATEGY}', this is a necessary condition for data prefetch`);
        }
        const encodedName = sdk.encodeName(name);
        const asyncEntryPath = path.resolve(compiler.options.context, `node_modules/${TEMP_DIR}/${encodedName}/bootstrap.js`);
        if (fs.existsSync(asyncEntryPath)) {
            fs.unlinkSync(asyncEntryPath);
        }
        if (!this.options.dataPrefetch) {
            return;
        }
        const exposeAlias = Object.keys(exposes);
        exposeAlias.forEach((alias) => {
            let exposePath;
            const exposeValue = exposes[alias];
            if (typeof exposeValue === 'string') {
                exposePath = exposeValue;
            }
            else {
                exposePath = exposeValue.import[0];
            }
            const targetPaths = fixPrefetchPath(exposePath);
            for (const pathItem of targetPaths) {
                const absolutePath = path.resolve(compiler.options.context, pathItem);
                if (fileExistsWithCaseSync(absolutePath)) {
                    const absoluteAlias = alias.replace('.', '');
                    this._reWriteExports += `export * as ${runtimeUtils.getPrefetchId(`${name}${absoluteAlias}`)} from '${absolutePath}';\n`;
                    break;
                }
            }
        });
        if (!this._reWriteExports) {
            return;
        }
        const tempDirRealPath = path.resolve(compiler.options.context, 'node_modules', TEMP_DIR);
        if (!fs.existsSync(tempDirRealPath)) {
            fs.mkdirSync(tempDirRealPath);
        }
        if (!fs.existsSync(`${tempDirRealPath}/${encodedName}`)) {
            fs.mkdirSync(`${tempDirRealPath}/${encodedName}`);
        }
        fs.writeFileSync(asyncEntryPath, this._reWriteExports);
        new compiler.webpack.DefinePlugin({
            FederationDataPrefetch: JSON.stringify(asyncEntryPath),
        }).apply(compiler);
    }
    static addRuntime(compiler, options) {
        const encodedName = sdk.encodeName(options.name);
        if (!compiler.options.context) {
            throw new Error('compiler.options.context is not defined');
        }
        const prefetchEntry = path.resolve(compiler.options.context, `node_modules/.mf/${encodedName}/bootstrap.js`);
        const federationGlobal = getFederationGlobalScope(RuntimeGlobals || {});
        return Template.asString([
            fs.existsSync(prefetchEntry)
                ? Template.indent([
                    'function injectPrefetch() {',
                    Template.indent([
                        `globalThis.__FEDERATION__ = globalThis.__FEDERATION__ || {};`,
                        `globalThis.__FEDERATION__['${sdk.MFPrefetchCommon.globalKey}'] = globalThis.__FEDERATION__['${sdk.MFPrefetchCommon.globalKey}'] || {`,
                        `entryLoading: {},`,
                        `instance: new Map(),`,
                        `__PREFETCH_EXPORTS__: {},`,
                        `};`,
                        `globalThis.__FEDERATION__['${sdk.MFPrefetchCommon.globalKey}']['${sdk.MFPrefetchCommon.exportsKey}'] = globalThis.__FEDERATION__['${sdk.MFPrefetchCommon.globalKey}']['${sdk.MFPrefetchCommon.exportsKey}'] || {};`,
                        `globalThis.__FEDERATION__['${sdk.MFPrefetchCommon.globalKey}']['${sdk.MFPrefetchCommon.exportsKey}']['${options.name}'] = function(){ return import('${prefetchEntry}');}`,
                    ]),
                    '}',
                    `${federationGlobal}.prefetch = injectPrefetch`,
                ])
                : '',
            Template.indent([
                `if(!${federationGlobal}.isMFRemote && ${federationGlobal}.prefetch){`,
                `${federationGlobal}.prefetch()`,
                '}',
            ]),
        ]);
    }
    static setRemoteIdentifier() {
        const federationGlobal = getFederationGlobalScope(RuntimeGlobals || {});
        return Template.indent([`${federationGlobal}.isMFRemote = true;`]);
    }
    static removeRemoteIdentifier() {
        const federationGlobal = getFederationGlobalScope(RuntimeGlobals || {});
        return Template.indent([`${federationGlobal}.isMFRemote = false;`]);
    }
}

exports.PrefetchPlugin = PrefetchPlugin;
exports.getFederationGlobalScope = getFederationGlobalScope;
//# sourceMappingURL=cli.cjs.cjs.map
