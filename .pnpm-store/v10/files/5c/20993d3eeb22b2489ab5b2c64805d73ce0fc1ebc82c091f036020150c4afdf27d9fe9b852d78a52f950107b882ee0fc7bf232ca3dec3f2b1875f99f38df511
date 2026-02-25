"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revalidate = exports.fetchRemote = exports.createFetcher = exports.checkFakeRemote = exports.checkMedusaConfigChange = exports.checkUnreachableRemote = exports.performReload = void 0;
exports.getFetchModule = getFetchModule;
const flush_chunks_1 = require("./flush-chunks");
const crypto_1 = __importDefault(require("crypto"));
const helpers_1 = __importDefault(require("@module-federation/runtime/helpers"));
const path_1 = __importDefault(require("path"));
const getRequire = () => {
    //@ts-ignore
    return typeof __non_webpack_require__ !== 'undefined'
        ? __non_webpack_require__
        : eval('require');
};
function callsites() {
    const _prepareStackTrace = Error.prepareStackTrace;
    try {
        let result = [];
        Error.prepareStackTrace = (_, callSites) => {
            const callSitesWithoutCurrent = callSites.slice(1);
            result = callSitesWithoutCurrent;
            return callSitesWithoutCurrent;
        };
        new Error().stack;
        return result;
    }
    finally {
        Error.prepareStackTrace = _prepareStackTrace;
    }
}
const find = function (moduleName) {
    if (moduleName[0] === '.') {
        // Use custom callsites function
        const stack = callsites();
        for (const frame of stack) {
            const filename = frame.getFileName();
            if (filename && filename !== module.filename) {
                moduleName = path_1.default.resolve(path_1.default.dirname(filename), moduleName);
                break;
            }
        }
    }
    try {
        return getRequire().resolve(moduleName);
    }
    catch (e) {
        return;
    }
};
/**
 * Removes a module from the cache. We need this to re-load our http_request !
 * see: https://stackoverflow.com/a/14801711/1148249
 */
const decache = async function (moduleName) {
    //@ts-ignore
    moduleName = find(moduleName);
    if (!moduleName) {
        return;
    }
    const currentChunk = getRequire().cache[__filename];
    // Run over the cache looking for the files
    // loaded by the specified module name
    searchCache(moduleName, function (mod) {
        delete getRequire().cache[mod.id];
    });
    try {
        // Remove cached paths to the module.
        // Thanks to @bentael for pointing this out.
        //@ts-ignore
        Object.keys(currentChunk.constructor._pathCache).forEach(function (cacheKey) {
            if (cacheKey.indexOf(moduleName) > -1) {
                //@ts-ignore
                delete currentChunk.constructor._pathCache[cacheKey];
            }
        });
    }
    catch (error) {
        //null
    }
};
/**
 * Runs over the cache to search for all the cached
 * files
 */
const searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    let mod = getRequire().resolve(moduleName);
    const visited = {};
    // Check if the module has been resolved and found within
    // the cache no else so #ignore else https://git.io/vtgMI
    /* istanbul ignore else */
    //@ts-ignore
    if (mod && (mod = getRequire().cache[mod]) !== undefined) {
        // Recursively go over the results
        (function run(current) {
            visited[current.id] = true;
            // Go over each of the module's children and
            // run over it
            current.children.forEach(function (child) {
                // ignore .node files, decaching native modules throws a
                // "module did not self-register" error on second require
                if (path_1.default.extname(child.filename) !== '.node' && !visited[child.id]) {
                    run(child);
                }
            });
            // Call the specified callback providing the
            // found module
            callback(current);
            //@ts-ignore
        })(mod);
    }
};
const hashmap = globalThis.mfHashMap || {};
globalThis.moduleGraphDirty = false;
const requireCacheRegex = /(remote|server|hot-reload|react-loadable-manifest|runtime|styled-jsx)/;
const performReload = async (shouldReload) => {
    if (!shouldReload) {
        return false;
    }
    const req = getRequire();
    const gs = new Function('return globalThis')();
    const entries = gs.entryChunkCache || new Set();
    //@ts-ignore
    gs.__FEDERATION__.__INSTANCES__.map((i) => {
        //@ts-ignore
        i.moduleCache.forEach((mc) => {
            if (mc.remoteInfo && mc.remoteInfo.entryGlobalName) {
                delete gs[mc.remoteInfo.entryGlobalName];
            }
        });
        i.moduleCache.clear();
        if (gs[i.name]) {
            delete gs[i.name];
        }
    });
    //@ts-ignore
    __webpack_require__?.federation?.instance?.moduleCache?.clear();
    helpers_1.default.global.resetFederationGlobalInfo();
    globalThis.moduleGraphDirty = false;
    globalThis.mfHashMap = {};
    if (!entries) {
        Object.keys(req.cache).forEach((key) => {
            if (requireCacheRegex.test(key)) {
                decache(key); // Use decache here
            }
        });
    }
    else {
        for (const entry of entries) {
            decache(entry);
            //reload entries again
            await getRequire()(entry);
        }
    }
    return true;
};
exports.performReload = performReload;
const checkUnreachableRemote = (remoteScope) => {
    for (const property in remoteScope.remotes) {
        if (!remoteScope[property]) {
            console.error('unreachable remote found', property, 'hot reloading to refetch');
            return true;
        }
    }
    return false;
};
exports.checkUnreachableRemote = checkUnreachableRemote;
const checkMedusaConfigChange = (remoteScope, fetchModule) => {
    //@ts-ignore
    if (remoteScope._medusa) {
        //@ts-ignore
        for (const property in remoteScope._medusa) {
            fetchModule(property)
                .then((res) => res.json())
                .then((medusaResponse) => {
                if (medusaResponse.version !==
                    //@ts-ignore
                    remoteScope?._medusa[property].version) {
                    console.log('medusa config changed', property, 'hot reloading to refetch');
                    (0, exports.performReload)(true);
                    return true;
                }
            });
        }
    }
    return false;
};
exports.checkMedusaConfigChange = checkMedusaConfigChange;
const checkFakeRemote = (remoteScope) => {
    for (const property in remoteScope._config) {
        let remote = remoteScope._config[property];
        const resolveRemote = async () => {
            remote = await remote();
        };
        if (typeof remote === 'function') {
            resolveRemote();
        }
        if (remote.fake) {
            console.log('fake remote found', property, 'hot reloading to refetch');
            return true;
        }
    }
    return false;
};
exports.checkFakeRemote = checkFakeRemote;
const createFetcher = (url, fetchModule, name, cb) => {
    return fetchModule(url)
        .then((re) => {
        if (!re.ok) {
            throw new Error(`Error loading remote: status: ${re.status}, content-type: ${re.headers.get('content-type')}`);
        }
        return re.text();
    })
        .then((contents) => {
        const hash = crypto_1.default.createHash('md5').update(contents).digest('hex');
        cb(hash);
    })
        .catch((e) => {
        console.error('Remote', name, url, 'Failed to load or is not online', e);
    });
};
exports.createFetcher = createFetcher;
const fetchRemote = (remoteScope, fetchModule) => {
    const fetches = [];
    let needReload = false;
    for (const property in remoteScope) {
        const name = property;
        const container = remoteScope[property];
        const url = container.entry;
        const fetcher = (0, exports.createFetcher)(url, fetchModule, name, (hash) => {
            if (hashmap[name]) {
                if (hashmap[name] !== hash) {
                    hashmap[name] = hash;
                    needReload = true;
                    console.log(name, 'hash is different - must hot reload server');
                }
            }
            else {
                hashmap[name] = hash;
            }
        });
        fetches.push(fetcher);
    }
    return Promise.all(fetches).then(() => {
        return needReload;
    });
};
exports.fetchRemote = fetchRemote;
//@ts-ignore
const revalidate = async (fetchModule = getFetchModule() || (() => { }), force = false) => {
    if (globalThis.moduleGraphDirty) {
        force = true;
    }
    const remotesFromAPI = (0, flush_chunks_1.getAllKnownRemotes)();
    //@ts-ignore
    return new Promise((res) => {
        if (force) {
            if (Object.keys(hashmap).length !== 0) {
                res(true);
                return;
            }
        }
        if ((0, exports.checkMedusaConfigChange)(remotesFromAPI, fetchModule)) {
            res(true);
        }
        if ((0, exports.checkFakeRemote)(remotesFromAPI)) {
            res(true);
        }
        (0, exports.fetchRemote)(remotesFromAPI, fetchModule).then((val) => {
            res(val);
        });
    }).then((shouldReload) => {
        return (0, exports.performReload)(shouldReload);
    });
};
exports.revalidate = revalidate;
function getFetchModule() {
    //@ts-ignore
    const loadedModule = 
    //@ts-ignore
    globalThis.webpackChunkLoad || global.webpackChunkLoad || global.fetch;
    if (loadedModule) {
        return loadedModule;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeFetch = require('node-fetch');
    return nodeFetch.default || nodeFetch;
}
//# sourceMappingURL=hot-reload.js.map