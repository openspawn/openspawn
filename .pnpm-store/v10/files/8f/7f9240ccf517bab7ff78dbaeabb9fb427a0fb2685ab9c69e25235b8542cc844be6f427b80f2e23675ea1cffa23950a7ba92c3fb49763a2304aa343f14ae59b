'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var prefetch = require('./prefetch.cjs.cjs');
var sdk = require('@module-federation/sdk');
var runtimeUtils = require('./runtime-utils.cjs.cjs');
var index = require('./index.cjs2.cjs');
var constant = require('./constant.cjs.cjs');

const loadingArray = [];
let sharedFlag = constant.SHARED_STRATEGY;
const prefetchPlugin = () => ({
    name: 'data-prefetch-runtime-plugin',
    initContainer(options) {
        const { remoteSnapshot, remoteInfo, id, origin } = options;
        const snapshot = remoteSnapshot;
        const { name } = remoteInfo;
        const prefetchOptions = {
            name,
            remote: remoteInfo,
            origin,
            remoteSnapshot: snapshot,
        };
        const signal = runtimeUtils.getSignalFromManifest(snapshot);
        if (!signal) {
            return options;
        }
        if (sharedFlag !== constant.SHARED_STRATEGY) {
            throw new Error(`[Module Federation Data Prefetch]: If you want to use data prefetch, the shared strategy must be 'loaded-first'`);
        }
        const instance = prefetch.MFDataPrefetch.getInstance(name) || new prefetch.MFDataPrefetch(prefetchOptions);
        let prefetchUrl;
        if (snapshot.prefetchEntry) {
            prefetchUrl = sdk.getResourceUrl(snapshot, snapshot.prefetchEntry);
        }
        const exist = loadingArray.find((loading) => loading.id === id);
        if (exist) {
            return options;
        }
        const promise = instance.loadEntry(prefetchUrl).then(() => prefetch.__awaiter(this, void 0, void 0, function* () {
            const projectExports = instance.getProjectExports();
            if (projectExports instanceof Promise) {
                yield projectExports;
            }
            return Promise.resolve().then(() => {
                const exports = instance.getExposeExports(id);
                index.logger.info(`1. Start Prefetch initContainer: ${id} - ${performance.now()}`);
                const result = Object.keys(exports).map((k) => {
                    const value = instance.prefetch({
                        id,
                        functionId: k,
                    });
                    const functionId = k;
                    return {
                        value,
                        functionId,
                    };
                });
                return result;
            });
        }));
        loadingArray.push({
            id,
            promise,
        });
        return options;
    },
    afterResolve(options) {
        const { remoteSnapshot, remoteInfo, id, origin } = options;
        const snapshot = remoteSnapshot;
        const { name } = remoteInfo;
        const prefetchOptions = {
            name,
            remote: remoteInfo,
            origin,
            remoteSnapshot: snapshot,
        };
        const signal = runtimeUtils.getSignalFromManifest(snapshot);
        if (!signal) {
            return options;
        }
        const inited = loadingArray.some((info) => info.id === id);
        if (!inited) {
            return options;
        }
        if (sharedFlag !== constant.SHARED_STRATEGY) {
            throw new Error(`[Module Federation Data Prefetch]: If you want to use data prefetch, the shared strategy must be 'loaded-first'`);
        }
        const instance = prefetch.MFDataPrefetch.getInstance(name) || new prefetch.MFDataPrefetch(prefetchOptions);
        let prefetchUrl;
        if (snapshot.prefetchEntry) {
            prefetchUrl = sdk.getResourceUrl(snapshot, snapshot.prefetchEntry);
        }
        const index$1 = loadingArray.findIndex((loading) => loading.id === id);
        if (index$1 !== -1) {
            loadingArray.splice(index$1, 1);
        }
        const promise = instance.loadEntry(prefetchUrl).then(() => prefetch.__awaiter(this, void 0, void 0, function* () {
            const projectExports = instance.getProjectExports();
            if (projectExports instanceof Promise) {
                yield projectExports;
            }
            return Promise.resolve().then(() => {
                const exports = instance.getExposeExports(id);
                index.logger.info(`1. Start Prefetch afterResolve: ${id} - ${performance.now()}`);
                const result = Object.keys(exports).map((k) => {
                    const value = instance.prefetch({
                        id,
                        functionId: k,
                    });
                    const functionId = k;
                    return {
                        value,
                        functionId,
                    };
                });
                return result;
            });
        }));
        loadingArray.push({
            id,
            promise,
        });
        return options;
    },
    onLoad(options) {
        return prefetch.__awaiter(this, void 0, void 0, function* () {
            var _a;
            const { remote, id } = options;
            const { name } = remote;
            const promise = (_a = loadingArray.find((loading) => loading.id === id)) === null || _a === void 0 ? void 0 : _a.promise;
            if (promise) {
                const prefetch$1 = yield promise;
                const prefetchValue = prefetch$1.map((result) => result.value);
                yield Promise.all(prefetchValue);
                const instance = prefetch.MFDataPrefetch.getInstance(name);
                prefetch$1.forEach((result) => {
                    const { value, functionId } = result;
                    instance.memorize(id + functionId, value);
                });
            }
            return options;
        });
    },
    beforeLoadShare(options) {
        const shareInfo = options.shareInfo;
        sharedFlag = (shareInfo === null || shareInfo === void 0 ? void 0 : shareInfo.strategy) || sharedFlag;
        return options;
    },
});

exports.default = prefetchPlugin;
exports.prefetchPlugin = prefetchPlugin;
//# sourceMappingURL=plugin.cjs.cjs.map
