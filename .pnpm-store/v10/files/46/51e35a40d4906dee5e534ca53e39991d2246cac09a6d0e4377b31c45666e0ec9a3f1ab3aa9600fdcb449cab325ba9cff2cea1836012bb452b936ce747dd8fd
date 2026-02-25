import pBtoa from 'btoa';
import { ContainerManager } from '@module-federation/managers';
import { createInfrastructureLogger, createLogger } from '@module-federation/sdk';

const isLoggerFactory = (candidate) => typeof candidate === 'function';
const createBundlerLogger = isLoggerFactory(createInfrastructureLogger)
    ? (prefix) => createInfrastructureLogger(prefix)
    : createLogger;
const logger = createBundlerLogger('[ Module Federation Rspack Plugin ]');

// @ts-ignore
const charMap = {
    '<': '\\u003C',
    '>': '\\u003E',
    '/': '\\u002F',
    '\\': '\\\\',
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\0': '\\0',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029',
};
function escapeUnsafeChars(str) {
    return str.replace(/[<>\b\f\n\r\t\0\u2028\u2029\\]/g, (x) => charMap[x]);
}
class RemoteEntryPlugin {
    constructor(options) {
        this.name = 'VmokRemoteEntryPlugin';
        this._options = options;
    }
    static addPublicPathEntry(compiler, getPublicPath, name) {
        let code;
        const sanitizedPublicPath = escapeUnsafeChars(getPublicPath);
        if (!getPublicPath.startsWith('function')) {
            code = `${compiler.webpack.RuntimeGlobals.publicPath} = new Function(${JSON.stringify(sanitizedPublicPath)})()`;
        }
        else {
            code = `(${sanitizedPublicPath}())`;
        }
        const base64Code = pBtoa(code);
        const dataUrl = `data:text/javascript;base64,${base64Code}`;
        compiler.hooks.afterPlugins.tap('VmokRemoteEntryPlugin', () => {
            new compiler.webpack.EntryPlugin(compiler.context, dataUrl, {
                name: name,
            }).apply(compiler);
        });
    }
    apply(compiler) {
        const { name, getPublicPath } = this._options;
        if (!getPublicPath || !name) {
            return;
        }
        const containerManager = new ContainerManager();
        containerManager.init(this._options);
        if (!containerManager.enable) {
            logger.warn("Detect you don't set exposes, 'getPublicPath' will not have effect.");
            return;
        }
        RemoteEntryPlugin.addPublicPathEntry(compiler, getPublicPath, name);
    }
}

export { RemoteEntryPlugin as R, logger as l };
//# sourceMappingURL=RemoteEntryPlugin.esm.mjs.map
