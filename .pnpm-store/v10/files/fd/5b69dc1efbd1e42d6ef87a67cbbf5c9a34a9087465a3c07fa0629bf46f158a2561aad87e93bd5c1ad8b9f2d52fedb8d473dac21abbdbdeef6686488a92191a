"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebpackRequirePatching = exports.setupChunkHandler = exports.setupScriptLoader = exports.deleteChunk = exports.installChunk = exports.loadChunk = exports.resolveUrl = exports.fetchAndRun = exports.loadFromFs = exports.returnFromGlobalInstances = exports.returnFromCache = exports.resolveFile = exports.nodeRuntimeImportCache = void 0;
exports.importNodeModule = importNodeModule;
exports.default = default_1;
exports.nodeRuntimeImportCache = new Map();
function importNodeModule(name) {
    if (!name) {
        throw new Error('import specifier is required');
    }
    // Check cache to prevent infinite recursion
    if (exports.nodeRuntimeImportCache.has(name)) {
        return exports.nodeRuntimeImportCache.get(name);
    }
    const importModule = new Function('name', `return import(name)`);
    const promise = importModule(name)
        .then((res) => res.default)
        .catch((error) => {
        console.error(`Error importing module ${name}:`, error);
        // Remove from cache on error so it can be retried
        exports.nodeRuntimeImportCache.delete(name);
        throw error;
    });
    // Cache the promise to prevent recursive calls
    exports.nodeRuntimeImportCache.set(name, promise);
    return promise;
}
// Hoisted utility function to resolve file paths for chunks
const resolveFile = (rootOutputDir, chunkId) => {
    const path = __non_webpack_require__('path');
    return path.join(__dirname, rootOutputDir + __webpack_require__.u(chunkId));
};
exports.resolveFile = resolveFile;
// Hoisted utility function to get remote entry from cache
const returnFromCache = (remoteName) => {
    const globalThisVal = new Function('return globalThis')();
    const federationInstances = globalThisVal['__FEDERATION__']['__INSTANCES__'];
    for (const instance of federationInstances) {
        const moduleContainer = instance.moduleCache.get(remoteName);
        if (moduleContainer?.remoteInfo)
            return moduleContainer.remoteInfo.entry;
    }
    return null;
};
exports.returnFromCache = returnFromCache;
// Hoisted utility function to get remote entry from global instances
const returnFromGlobalInstances = (remoteName) => {
    const globalThisVal = new Function('return globalThis')();
    const federationInstances = globalThisVal['__FEDERATION__']['__INSTANCES__'];
    for (const instance of federationInstances) {
        for (const remote of instance.options.remotes) {
            if (remote.name === remoteName || remote.alias === remoteName) {
                console.log('Backup remote entry found:', remote.entry);
                return remote.entry;
            }
        }
    }
    return null;
};
exports.returnFromGlobalInstances = returnFromGlobalInstances;
// Hoisted utility function to load chunks from filesystem
const loadFromFs = (filename, callback) => {
    const fs = __non_webpack_require__('fs');
    const path = __non_webpack_require__('path');
    const vm = __non_webpack_require__('vm');
    if (fs.existsSync(filename)) {
        fs.readFile(filename, 'utf-8', (err, content) => {
            if (err)
                return callback(err, null);
            const chunk = {};
            try {
                const script = new vm.Script(`(function(exports, require, __dirname, __filename) {${content}\n})`, {
                    filename,
                    importModuleDynamically: 
                    //@ts-ignore
                    vm.constants?.USE_MAIN_CONTEXT_DEFAULT_LOADER ?? importNodeModule,
                });
                script.runInThisContext()(chunk, __non_webpack_require__, path.dirname(filename), filename);
                callback(null, chunk);
            }
            catch (e) {
                console.log("'runInThisContext threw'", e);
                callback(e, null);
            }
        });
    }
    else {
        callback(new Error(`File ${filename} does not exist`), null);
    }
};
exports.loadFromFs = loadFromFs;
// Hoisted utility function to fetch and execute chunks from remote URLs
const fetchAndRun = (url, chunkName, callback, args) => {
    (typeof fetch === 'undefined'
        ? importNodeModule('node-fetch').then((mod) => mod.default)
        : Promise.resolve(fetch))
        .then((fetchFunction) => {
        return args.origin.loaderHook.lifecycle.fetch
            .emit(url.href, {})
            .then((res) => {
            if (!res || !(res instanceof Response)) {
                return fetchFunction(url.href).then((response) => response.text());
            }
            return res.text();
        });
    })
        .then((data) => {
        const chunk = {};
        try {
            eval(`(function(exports, require, __dirname, __filename) {${data}\n})`)(chunk, __non_webpack_require__, url.pathname.split('/').slice(0, -1).join('/'), chunkName);
            callback(null, chunk);
        }
        catch (e) {
            callback(e, null);
        }
    })
        .catch((err) => callback(err, null));
};
exports.fetchAndRun = fetchAndRun;
// Hoisted utility function to resolve URLs for chunks
const resolveUrl = (remoteName, chunkName) => {
    try {
        return new URL(chunkName, __webpack_require__.p);
    }
    catch {
        const entryUrl = (0, exports.returnFromCache)(remoteName) || (0, exports.returnFromGlobalInstances)(remoteName);
        if (!entryUrl)
            return null;
        const url = new URL(entryUrl);
        const path = __non_webpack_require__('path');
        // Extract the directory path from the remote entry URL
        // e.g., from "http://url/static/js/remoteEntry.js" to "/static/js/"
        const urlPath = url.pathname;
        const lastSlashIndex = urlPath.lastIndexOf('/');
        const directoryPath = lastSlashIndex >= 0 ? urlPath.substring(0, lastSlashIndex + 1) : '/';
        // Get rootDir from webpack configuration
        const rootDir = __webpack_require__.federation.rootOutputDir || '';
        // Use path.join to combine the paths properly while handling slashes
        // Convert Windows-style paths to URL-style paths
        const combinedPath = path
            .join(directoryPath, rootDir, chunkName)
            .replace(/\\/g, '/');
        // Create the final URL
        return new URL(combinedPath, url.origin);
    }
};
exports.resolveUrl = resolveUrl;
// Hoisted utility function to load chunks based on different strategies
const loadChunk = (strategy, chunkId, rootOutputDir, callback, args) => {
    if (strategy === 'filesystem') {
        return (0, exports.loadFromFs)((0, exports.resolveFile)(rootOutputDir, chunkId), callback);
    }
    const url = (0, exports.resolveUrl)(rootOutputDir, chunkId);
    if (!url)
        return callback(null, { modules: {}, ids: [], runtime: null });
    // Using fetchAndRun directly with args
    (0, exports.fetchAndRun)(url, chunkId, callback, args);
};
exports.loadChunk = loadChunk;
// Hoisted utility function to install a chunk into webpack
const installChunk = (chunk, installedChunks) => {
    for (const moduleId in chunk.modules) {
        __webpack_require__.m[moduleId] = chunk.modules[moduleId];
    }
    if (chunk.runtime)
        chunk.runtime(__webpack_require__);
    for (const chunkId of chunk.ids) {
        if (installedChunks[chunkId])
            installedChunks[chunkId][0]();
        installedChunks[chunkId] = 0;
    }
};
exports.installChunk = installChunk;
// Hoisted utility function to remove a chunk on fail
const deleteChunk = (chunkId, installedChunks) => {
    delete installedChunks[chunkId];
    return true;
};
exports.deleteChunk = deleteChunk;
// Hoisted function to set up webpack script loader
const setupScriptLoader = () => {
    __webpack_require__.l = (url, done, key, chunkId) => {
        if (!key || chunkId)
            throw new Error(`__webpack_require__.l name is required for ${url}`);
        __webpack_require__.federation.runtime
            .loadScriptNode(url, { attrs: { globalName: key } })
            .then((res) => {
            const enhancedRemote = __webpack_require__.federation.instance.initRawContainer(key, url, res);
            new Function('return globalThis')()[key] = enhancedRemote;
            done(enhancedRemote);
        })
            .catch(done);
    };
};
exports.setupScriptLoader = setupScriptLoader;
// Hoisted function to set up chunk handler
const setupChunkHandler = (installedChunks, args) => {
    return (chunkId, promises) => {
        let installedChunkData = installedChunks[chunkId];
        if (installedChunkData !== 0) {
            if (installedChunkData) {
                promises.push(installedChunkData[2]);
            }
            else {
                const matcher = __webpack_require__.federation.chunkMatcher
                    ? __webpack_require__.federation.chunkMatcher(chunkId)
                    : true;
                if (matcher) {
                    const promise = new Promise((resolve, reject) => {
                        installedChunkData = installedChunks[chunkId] = [resolve, reject];
                        const fs = typeof process !== 'undefined'
                            ? __non_webpack_require__('fs')
                            : false;
                        const filename = typeof process !== 'undefined'
                            ? (0, exports.resolveFile)(__webpack_require__.federation.rootOutputDir || '', chunkId)
                            : false;
                        if (fs && fs.existsSync(filename)) {
                            (0, exports.loadChunk)('filesystem', chunkId, __webpack_require__.federation.rootOutputDir || '', (err, chunk) => {
                                if (err)
                                    return (0, exports.deleteChunk)(chunkId, installedChunks) && reject(err);
                                if (chunk)
                                    (0, exports.installChunk)(chunk, installedChunks);
                                resolve(chunk);
                            }, args);
                        }
                        else {
                            const chunkName = __webpack_require__.u(chunkId);
                            const loadingStrategy = typeof process === 'undefined' ? 'http-eval' : 'http-vm';
                            (0, exports.loadChunk)(loadingStrategy, chunkName, __webpack_require__.federation.initOptions.name, (err, chunk) => {
                                if (err)
                                    return (0, exports.deleteChunk)(chunkId, installedChunks) && reject(err);
                                if (chunk)
                                    (0, exports.installChunk)(chunk, installedChunks);
                                resolve(chunk);
                            }, args);
                        }
                    });
                    promises.push((installedChunkData[2] = promise));
                }
                else {
                    installedChunks[chunkId] = 0;
                }
            }
        }
    };
};
exports.setupChunkHandler = setupChunkHandler;
// Hoisted function to set up webpack require patching
const setupWebpackRequirePatching = (handle) => {
    if (__webpack_require__.f) {
        if (__webpack_require__.f.require) {
            console.warn('\x1b[33m%s\x1b[0m', 'CAUTION: build target is not set to "async-node", attempting to patch additional chunk handlers. This may not work');
            __webpack_require__.f.require = handle;
        }
        if (__webpack_require__.f.readFileVm) {
            __webpack_require__.f.readFileVm = handle;
        }
    }
};
exports.setupWebpackRequirePatching = setupWebpackRequirePatching;
function default_1() {
    return {
        name: 'node-federation-plugin',
        beforeInit(args) {
            // Patch webpack chunk loading handlers
            (() => {
                // Create the chunk tracking object
                const installedChunks = {};
                // Set up webpack script loader
                (0, exports.setupScriptLoader)();
                // Create and set up the chunk handler
                const handle = (0, exports.setupChunkHandler)(installedChunks, args);
                // Patch webpack require
                (0, exports.setupWebpackRequirePatching)(handle);
            })();
            return args;
        },
    };
}
//# sourceMappingURL=runtimePlugin.js.map