'use strict';

var runtime = require('@module-federation/runtime');
var sdk = require('@module-federation/sdk');
var runtimeUtils = require('./runtime-utils.cjs.cjs');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var _a, _b;
var _c;
(_a = globalThis.__FEDERATION__) !== null && _a !== void 0 ? _a : (globalThis.__FEDERATION__ = {});
(_b = (_c = globalThis.__FEDERATION__).__PREFETCH__) !== null && _b !== void 0 ? _b : (_c.__PREFETCH__ = {
    entryLoading: {},
    instance: new Map(),
    __PREFETCH_EXPORTS__: {},
});
class MFDataPrefetch {
    constructor(options) {
        this.prefetchMemory = new Map();
        this.recordOutdate = {};
        this._exports = {};
        this._options = options;
        this.global.instance.set(options.name, this);
    }
    get global() {
        return globalThis.__FEDERATION__
            .__PREFETCH__;
    }
    static getInstance(id) {
        return globalThis.__FEDERATION__.__PREFETCH__.instance.get(id);
    }
    loadEntry(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, remoteSnapshot, remote, origin } = this._options;
            if (entry) {
                const { buildVersion, globalName } = remoteSnapshot;
                const uniqueKey = globalName || `${name}:${buildVersion}`;
                if (!this.global.entryLoading[uniqueKey]) {
                    this.global.entryLoading[uniqueKey] = sdk.loadScript(entry, {});
                }
                return this.global.entryLoading[uniqueKey];
            }
            else {
                const remoteInfo = runtime.getRemoteInfo(remote);
                const module = origin.moduleCache.get(remoteInfo.name);
                return runtime.getRemoteEntry({
                    origin: origin,
                    remoteInfo,
                    remoteEntryExports: module ? module.remoteEntryExports : undefined,
                });
            }
        });
    }
    getProjectExports() {
        var _a;
        if (Object.keys(this._exports).length > 0) {
            return this._exports;
        }
        const { name } = this._options;
        const exportsPromiseFn = (_a = globalThis.__FEDERATION__.__PREFETCH__.__PREFETCH_EXPORTS__) === null || _a === void 0 ? void 0 : _a[name];
        const exportsPromise = typeof exportsPromiseFn === 'function'
            ? exportsPromiseFn()
            : exportsPromiseFn;
        const resolve = exportsPromise.then((exports = {}) => {
            const memory = {};
            Object.keys(exports).forEach((key) => {
                memory[key] = {};
                const exportVal = exports[key];
                Object.keys(exportVal).reduce((memo, current) => {
                    if (current.toLocaleLowerCase().endsWith('prefetch') ||
                        current.toLocaleLowerCase() === 'default') {
                        memo[current] = exportVal[current];
                    }
                    return memo;
                }, memory[key]);
            });
            this.memorizeExports(memory);
        });
        return resolve;
    }
    memorizeExports(exports) {
        this._exports = exports;
    }
    getExposeExports(id) {
        const prefetchId = runtimeUtils.getPrefetchId(id);
        const compatId = runtimeUtils.compatGetPrefetchId(id);
        const prefetchExports = this._exports[prefetchId] || this._exports[compatId];
        return prefetchExports || {};
    }
    prefetch(prefetchOptions) {
        const { id, functionId = 'default', refetchParams } = prefetchOptions;
        let prefetchResult;
        const prefetchId = runtimeUtils.getPrefetchId(id);
        const compatId = runtimeUtils.compatGetPrefetchId(id);
        const memorizeId = id + functionId;
        const memory = this.prefetchMemory.get(memorizeId);
        if (!this.checkOutdate(prefetchOptions) && memory) {
            return memory;
        }
        const prefetchExports = this._exports[prefetchId] || this._exports[compatId];
        if (!prefetchExports) {
            return;
        }
        const executePrefetch = prefetchExports[functionId];
        if (typeof executePrefetch === 'function') {
            if (refetchParams) {
                prefetchResult = executePrefetch(refetchParams);
            }
            else {
                prefetchResult = executePrefetch();
            }
        }
        else {
            throw new Error(`[Module Federation Data Prefetch]: No prefetch function called ${functionId} export in prefetch file`);
        }
        this.memorize(memorizeId, prefetchResult);
        return prefetchResult;
    }
    memorize(id, value) {
        this.prefetchMemory.set(id, value);
    }
    markOutdate(markOptions, isOutdate) {
        const { id, functionId = 'default' } = markOptions;
        if (!this.recordOutdate[id]) {
            this.recordOutdate[id] = {};
        }
        this.recordOutdate[id][functionId] = isOutdate;
    }
    checkOutdate(outdateOptions) {
        const { id, functionId = 'default', cacheStrategy } = outdateOptions;
        if (typeof cacheStrategy === 'function') {
            return cacheStrategy();
        }
        if (!this.recordOutdate[id]) {
            this.recordOutdate[id] = {};
        }
        if (this.recordOutdate[id][functionId]) {
            this.markOutdate({
                id,
                functionId,
            }, false);
            return true;
        }
        else {
            return false;
        }
    }
}

exports.MFDataPrefetch = MFDataPrefetch;
exports.__awaiter = __awaiter;
//# sourceMappingURL=prefetch.cjs.cjs.map
