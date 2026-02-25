import { M as MFDataPrefetch } from './prefetch.esm.js';
import { g as getScope } from './runtime-utils.esm.js';

function prefetch(options) {
    const { id, functionId = 'default' } = options;
    const mfScope = getScope();
    const prefetchInstance = MFDataPrefetch.getInstance(mfScope) ||
        new MFDataPrefetch({
            name: mfScope,
        });
    const res = prefetchInstance.getProjectExports();
    if (res instanceof Promise) {
        const promise = res.then(() => {
            const result = prefetchInstance.prefetch(options);
            prefetchInstance.memorize(id + functionId, result);
            return result;
        });
        return promise;
    }
    else {
        const result = prefetchInstance.prefetch(options);
        prefetchInstance.memorize(id + functionId, result);
        return result;
    }
}

export { prefetch };
//# sourceMappingURL=universal.esm.js.map
