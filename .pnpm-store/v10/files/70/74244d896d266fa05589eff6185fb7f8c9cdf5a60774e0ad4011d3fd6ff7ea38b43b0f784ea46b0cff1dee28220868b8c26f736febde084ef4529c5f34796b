'use strict';

var react = require('react');
var index = require('./index.cjs2.cjs');
var prefetch = require('./prefetch.cjs.cjs');
var universal = require('./universal.cjs.cjs');
var runtimeUtils = require('./runtime-utils.cjs.cjs');

const useFirstMounted = () => {
    const ref = react.useRef(true);
    react.useEffect(() => {
        ref.current = false;
    }, []);
    return ref.current;
};

const usePrefetch = (options) => {
    const isFirstMounted = useFirstMounted();
    if (isFirstMounted) {
        const startTiming = performance.now();
        index.logger.info(`2. Start Get Prefetch Data: ${options.id} - ${options.functionId || 'default'} - ${startTiming}`);
    }
    const { id, functionId, deferId } = options;
    const prefetchInfo = {
        id,
        functionId,
    };
    const mfScope = runtimeUtils.getScope();
    let state;
    const prefetchResult = universal.prefetch(options);
    if (deferId) {
        if (prefetchResult instanceof Promise) {
            state = prefetchResult.then((deferredData) => deferredData.data[deferId]);
        }
        else {
            state = prefetchResult.data[deferId];
        }
    }
    else {
        state = prefetchResult;
    }
    const [prefetchState, setPrefetchState] = react.useState(state);
    const prefetchInstance = prefetch.MFDataPrefetch.getInstance(mfScope);
    react.useEffect(() => {
        const useEffectTiming = performance.now();
        index.logger.info(`3. Start Execute UseEffect: ${options.id} - ${options.functionId || 'default'} - ${useEffectTiming}`);
        return () => {
            prefetchInstance === null || prefetchInstance === void 0 ? void 0 : prefetchInstance.markOutdate(prefetchInfo, true);
        };
    }, []);
    const refreshExecutor = (refetchParams) => {
        const refetchOptions = Object.assign({}, options);
        if (refetchParams) {
            refetchOptions.refetchParams = refetchParams;
        }
        prefetchInstance === null || prefetchInstance === void 0 ? void 0 : prefetchInstance.markOutdate(prefetchInfo, true);
        const newVal = universal.prefetch(refetchOptions);
        let newState;
        if (deferId) {
            if (newVal instanceof Promise) {
                newState = newVal.then((deferredData) => deferredData.data[deferId]);
            }
            else {
                newState = newVal.data[deferId];
            }
        }
        else {
            newState = newVal;
        }
        setPrefetchState(newState);
    };
    return [prefetchState, refreshExecutor];
};

exports.usePrefetch = usePrefetch;
//# sourceMappingURL=react.cjs.cjs.map
