import { _ as __awaiter, M as MFDataPrefetch } from './prefetch.esm.js';
import { getResourceUrl } from '@module-federation/sdk';
import { a as getSignalFromManifest } from './runtime-utils.esm.js';
import { l as logger } from './index.esm2.js';
import { S as SHARED_STRATEGY } from './constant.esm.js';

const loadingArray = [];
let sharedFlag = SHARED_STRATEGY;
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
        const signal = getSignalFromManifest(snapshot);
        if (!signal) {
            return options;
        }
        if (sharedFlag !== SHARED_STRATEGY) {
            throw new Error(`[Module Federation Data Prefetch]: If you want to use data prefetch, the shared strategy must be 'loaded-first'`);
        }
        const instance = MFDataPrefetch.getInstance(name) || new MFDataPrefetch(prefetchOptions);
        let prefetchUrl;
        if (snapshot.prefetchEntry) {
            prefetchUrl = getResourceUrl(snapshot, snapshot.prefetchEntry);
        }
        const exist = loadingArray.find((loading) => loading.id === id);
        if (exist) {
            return options;
        }
        const promise = instance.loadEntry(prefetchUrl).then(() => __awaiter(this, void 0, void 0, function* () {
            const projectExports = instance.getProjectExports();
            if (projectExports instanceof Promise) {
                yield projectExports;
            }
            return Promise.resolve().then(() => {
                const exports = instance.getExposeExports(id);
                logger.info(`1. Start Prefetch initContainer: ${id} - ${performance.now()}`);
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
        const signal = getSignalFromManifest(snapshot);
        if (!signal) {
            return options;
        }
        const inited = loadingArray.some((info) => info.id === id);
        if (!inited) {
            return options;
        }
        if (sharedFlag !== SHARED_STRATEGY) {
            throw new Error(`[Module Federation Data Prefetch]: If you want to use data prefetch, the shared strategy must be 'loaded-first'`);
        }
        const instance = MFDataPrefetch.getInstance(name) || new MFDataPrefetch(prefetchOptions);
        let prefetchUrl;
        if (snapshot.prefetchEntry) {
            prefetchUrl = getResourceUrl(snapshot, snapshot.prefetchEntry);
        }
        const index = loadingArray.findIndex((loading) => loading.id === id);
        if (index !== -1) {
            loadingArray.splice(index, 1);
        }
        const promise = instance.loadEntry(prefetchUrl).then(() => __awaiter(this, void 0, void 0, function* () {
            const projectExports = instance.getProjectExports();
            if (projectExports instanceof Promise) {
                yield projectExports;
            }
            return Promise.resolve().then(() => {
                const exports = instance.getExposeExports(id);
                logger.info(`1. Start Prefetch afterResolve: ${id} - ${performance.now()}`);
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
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { remote, id } = options;
            const { name } = remote;
            const promise = (_a = loadingArray.find((loading) => loading.id === id)) === null || _a === void 0 ? void 0 : _a.promise;
            if (promise) {
                const prefetch = yield promise;
                const prefetchValue = prefetch.map((result) => result.value);
                yield Promise.all(prefetchValue);
                const instance = MFDataPrefetch.getInstance(name);
                prefetch.forEach((result) => {
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

export { prefetchPlugin as default, prefetchPlugin };
//# sourceMappingURL=plugin.esm.js.map
