'use strict';

var prefetch$1 = require('./prefetch.cjs.cjs');
var runtimeUtils = require('./runtime-utils.cjs.cjs');

function prefetch(options) {
    const { id, functionId = 'default' } = options;
    const mfScope = runtimeUtils.getScope();
    const prefetchInstance = prefetch$1.MFDataPrefetch.getInstance(mfScope) ||
        new prefetch$1.MFDataPrefetch({
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

exports.prefetch = prefetch;
//# sourceMappingURL=universal.cjs.cjs.map
