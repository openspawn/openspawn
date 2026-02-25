"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = __importDefault(require("process"));
const buffer_1 = require("buffer");
const stream_1 = require("stream");
const url_1 = require("url");
const http_1 = __importStar(require("http"));
const http_timer_1 = __importDefault(require("@szmarczak/http-timer"));
const cacheable_request_1 = __importDefault(require("cacheable-request"));
const decompress_response_1 = __importDefault(require("decompress-response"));
const is_1 = __importDefault(require("@sindresorhus/is"));
const get_stream_1 = require("get-stream");
// @ts-ignore
const form_data_encoder_1 = require("form-data-encoder");
const get_body_size_js_1 = __importDefault(require("./utils/get-body-size.js"));
const is_form_data_js_1 = __importDefault(require("./utils/is-form-data.js"));
const proxy_events_js_1 = __importDefault(require("./utils/proxy-events.js"));
const timed_out_js_1 = __importStar(require("./timed-out.js"));
const url_to_options_js_1 = __importDefault(require("./utils/url-to-options.js"));
const weakable_map_js_1 = __importDefault(require("./utils/weakable-map.js"));
const calculate_retry_delay_js_1 = __importDefault(require("./calculate-retry-delay.js"));
const options_js_1 = __importDefault(require("./options.js"));
const response_js_1 = require("./response.js");
const is_client_request_js_1 = __importDefault(require("./utils/is-client-request.js"));
const is_unix_socket_url_js_1 = __importDefault(require("./utils/is-unix-socket-url.js"));
const errors_js_1 = require("./errors.js");
const supportsBrotli = is_1.default.string(process_1.default.versions.brotli);
const methodsWithoutBody = new Set(['GET', 'HEAD']);
const cacheableStore = new weakable_map_js_1.default();
const redirectCodes = new Set([300, 301, 302, 303, 304, 307, 308]);
const proxiedRequestEvents = [
    'socket',
    'connect',
    'continue',
    'information',
    'upgrade',
];
const noop = () => { };
class Request extends stream_1.Duplex {
    constructor(url, options, defaults) {
        super({
            // Don't destroy immediately, as the error may be emitted on unsuccessful retry
            autoDestroy: false,
            // It needs to be zero because we're just proxying the data to another stream
            highWaterMark: 0,
        });
        // @ts-expect-error - Ignoring for now.
        Object.defineProperty(this, 'constructor', {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_noPipe", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // @ts-expect-error https://github.com/microsoft/TypeScript/issues/9568
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "response", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "requestUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "redirectUrls", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "retryCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_stopRetry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_downloadedSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_uploadedSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_stopReading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_pipedServerResponses", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_request", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_responseSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_bodySize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_unproxyEvents", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_isFromCache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_cannotHaveBody", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_triggerRead", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_cancelTimeouts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_nativeResponse", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_flushed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_aborted", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // We need this because `this._request` if `undefined` when using cache
        Object.defineProperty(this, "_requestInitialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this._downloadedSize = 0;
        this._uploadedSize = 0;
        this._stopReading = false;
        this._pipedServerResponses = new Set();
        this._cannotHaveBody = false;
        this._unproxyEvents = noop;
        this._triggerRead = false;
        this._cancelTimeouts = noop;
        this._jobs = [];
        this._flushed = false;
        this._requestInitialized = false;
        this._aborted = false;
        this.redirectUrls = [];
        this.retryCount = 0;
        this._stopRetry = noop;
        this.on('pipe', source => {
            if (source.headers) {
                Object.assign(this.options.headers, source.headers);
            }
        });
        this.on('newListener', event => {
            if (event === 'retry' && this.listenerCount('retry') > 0) {
                throw new Error('A retry listener has been attached already.');
            }
        });
        try {
            this.options = new options_js_1.default(url, options, defaults);
            if (!this.options.url) {
                if (this.options.prefixUrl === '') {
                    throw new TypeError('Missing `url` property');
                }
                this.options.url = '';
            }
            this.requestUrl = this.options.url;
        }
        catch (error) {
            const { options } = error;
            if (options) {
                this.options = options;
            }
            this.flush = async () => {
                this.flush = async () => { };
                this.destroy(error);
            };
            return;
        }
        if (this.options.signal?.aborted) {
            this.destroy(new errors_js_1.AbortError(this));
        }
        this.options.signal?.addEventListener('abort', () => {
            this.destroy(new errors_js_1.AbortError(this));
        });
        // Important! If you replace `body` in a handler with another stream, make sure it's readable first.
        // The below is run only once.
        const { body } = this.options;
        if (is_1.default.nodeStream(body)) {
            body.once('error', error => {
                if (this._flushed) {
                    this._beforeError(new errors_js_1.UploadError(error, this));
                }
                else {
                    this.flush = async () => {
                        this.flush = async () => { };
                        this._beforeError(new errors_js_1.UploadError(error, this));
                    };
                }
            });
        }
    }
    async flush() {
        if (this._flushed) {
            return;
        }
        this._flushed = true;
        try {
            await this._finalizeBody();
            if (this.destroyed) {
                return;
            }
            await this._makeRequest();
            if (this.destroyed) {
                this._request?.destroy();
                return;
            }
            // Queued writes etc.
            for (const job of this._jobs) {
                job();
            }
            // Prevent memory leak
            this._jobs.length = 0;
            this._requestInitialized = true;
        }
        catch (error) {
            this._beforeError(error);
        }
    }
    _beforeError(error) {
        if (this._stopReading) {
            return;
        }
        const { response, options } = this;
        const attemptCount = this.retryCount + (error.name === 'RetryError' ? 0 : 1);
        this._stopReading = true;
        if (!(error instanceof errors_js_1.RequestError)) {
            error = new errors_js_1.RequestError(error.message, error, this);
        }
        const typedError = error;
        void (async () => {
            // Node.js parser is really weird.
            // It emits post-request Parse Errors on the same instance as previous request. WTF.
            // Therefore we need to check if it has been destroyed as well.
            //
            // Furthermore, Node.js 16 `response.destroy()` doesn't immediately destroy the socket,
            // but makes the response unreadable. So we additionally need to check `response.readable`.
            if (response?.readable && !response.rawBody && !this._request?.socket?.destroyed) {
                // @types/node has incorrect typings. `setEncoding` accepts `null` as well.
                response.setEncoding(this.readableEncoding);
                const success = await this._setRawBody(response);
                if (success) {
                    response.body = response.rawBody.toString();
                }
            }
            if (this.listenerCount('retry') !== 0) {
                let backoff;
                try {
                    let retryAfter;
                    if (response && 'retry-after' in response.headers) {
                        retryAfter = Number(response.headers['retry-after']);
                        if (Number.isNaN(retryAfter)) {
                            retryAfter = Date.parse(response.headers['retry-after']) - Date.now();
                            if (retryAfter <= 0) {
                                retryAfter = 1;
                            }
                        }
                        else {
                            retryAfter *= 1000;
                        }
                    }
                    const retryOptions = options.retry;
                    backoff = await retryOptions.calculateDelay({
                        attemptCount,
                        retryOptions,
                        error: typedError,
                        retryAfter,
                        computedValue: (0, calculate_retry_delay_js_1.default)({
                            attemptCount,
                            retryOptions,
                            error: typedError,
                            retryAfter,
                            computedValue: retryOptions.maxRetryAfter ?? options.timeout.request ?? Number.POSITIVE_INFINITY,
                        }),
                    });
                }
                catch (error_) {
                    void this._error(new errors_js_1.RequestError(error_.message, error_, this));
                    return;
                }
                if (backoff) {
                    await new Promise(resolve => {
                        const timeout = setTimeout(resolve, backoff);
                        this._stopRetry = () => {
                            clearTimeout(timeout);
                            resolve();
                        };
                    });
                    // Something forced us to abort the retry
                    if (this.destroyed) {
                        return;
                    }
                    try {
                        for (const hook of this.options.hooks.beforeRetry) {
                            // eslint-disable-next-line no-await-in-loop
                            await hook(typedError, this.retryCount + 1);
                        }
                    }
                    catch (error_) {
                        void this._error(new errors_js_1.RequestError(error_.message, error, this));
                        return;
                    }
                    // Something forced us to abort the retry
                    if (this.destroyed) {
                        return;
                    }
                    this.destroy();
                    this.emit('retry', this.retryCount + 1, error, (updatedOptions) => {
                        const request = new Request(options.url, updatedOptions, options);
                        request.retryCount = this.retryCount + 1;
                        process_1.default.nextTick(() => {
                            void request.flush();
                        });
                        return request;
                    });
                    return;
                }
            }
            void this._error(typedError);
        })();
    }
    _read() {
        this._triggerRead = true;
        const { response } = this;
        if (response && !this._stopReading) {
            // We cannot put this in the `if` above
            // because `.read()` also triggers the `end` event
            if (response.readableLength) {
                this._triggerRead = false;
            }
            let data;
            while ((data = response.read()) !== null) {
                this._downloadedSize += data.length; // eslint-disable-line @typescript-eslint/restrict-plus-operands
                const progress = this.downloadProgress;
                if (progress.percent < 1) {
                    this.emit('downloadProgress', progress);
                }
                this.push(data);
            }
        }
    }
    _write(chunk, encoding, callback) {
        const write = () => {
            this._writeRequest(chunk, encoding, callback);
        };
        if (this._requestInitialized) {
            write();
        }
        else {
            this._jobs.push(write);
        }
    }
    _final(callback) {
        const endRequest = () => {
            // We need to check if `this._request` is present,
            // because it isn't when we use cache.
            if (!this._request || this._request.destroyed) {
                callback();
                return;
            }
            this._request.end((error) => {
                // The request has been destroyed before `_final` finished.
                // See https://github.com/nodejs/node/issues/39356
                if (this._request._writableState?.errored) {
                    return;
                }
                if (!error) {
                    this._bodySize = this._uploadedSize;
                    this.emit('uploadProgress', this.uploadProgress);
                    this._request.emit('upload-complete');
                }
                callback(error);
            });
        };
        if (this._requestInitialized) {
            endRequest();
        }
        else {
            this._jobs.push(endRequest);
        }
    }
    _destroy(error, callback) {
        this._stopReading = true;
        this.flush = async () => { };
        // Prevent further retries
        this._stopRetry();
        this._cancelTimeouts();
        if (this.options) {
            const { body } = this.options;
            if (is_1.default.nodeStream(body)) {
                body.destroy();
            }
        }
        if (this._request) {
            this._request.destroy();
        }
        if (error !== null && !is_1.default.undefined(error) && !(error instanceof errors_js_1.RequestError)) {
            error = new errors_js_1.RequestError(error.message, error, this);
        }
        callback(error);
    }
    pipe(destination, options) {
        if (destination instanceof http_1.ServerResponse) {
            this._pipedServerResponses.add(destination);
        }
        return super.pipe(destination, options);
    }
    unpipe(destination) {
        if (destination instanceof http_1.ServerResponse) {
            this._pipedServerResponses.delete(destination);
        }
        super.unpipe(destination);
        return this;
    }
    async _finalizeBody() {
        const { options } = this;
        const { headers } = options;
        const isForm = !is_1.default.undefined(options.form);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const isJSON = !is_1.default.undefined(options.json);
        const isBody = !is_1.default.undefined(options.body);
        const cannotHaveBody = methodsWithoutBody.has(options.method) && !(options.method === 'GET' && options.allowGetBody);
        this._cannotHaveBody = cannotHaveBody;
        if (isForm || isJSON || isBody) {
            if (cannotHaveBody) {
                throw new TypeError(`The \`${options.method}\` method cannot be used with a body`);
            }
            // Serialize body
            const noContentType = !is_1.default.string(headers['content-type']);
            if (isBody) {
                // Body is spec-compliant FormData
                if ((0, form_data_encoder_1.isFormData)(options.body)) {
                    const encoder = new form_data_encoder_1.FormDataEncoder(options.body);
                    if (noContentType) {
                        headers['content-type'] = encoder.headers['Content-Type'];
                    }
                    if ('Content-Length' in encoder.headers) {
                        headers['content-length'] = encoder.headers['Content-Length'];
                    }
                    options.body = encoder.encode();
                }
                // Special case for https://github.com/form-data/form-data
                if ((0, is_form_data_js_1.default)(options.body) && noContentType) {
                    headers['content-type'] = `multipart/form-data; boundary=${options.body.getBoundary()}`;
                }
            }
            else if (isForm) {
                if (noContentType) {
                    headers['content-type'] = 'application/x-www-form-urlencoded';
                }
                const { form } = options;
                options.form = undefined;
                options.body = (new url_1.URLSearchParams(form)).toString();
            }
            else {
                if (noContentType) {
                    headers['content-type'] = 'application/json';
                }
                const { json } = options;
                options.json = undefined;
                options.body = options.stringifyJson(json);
            }
            const uploadBodySize = await (0, get_body_size_js_1.default)(options.body, options.headers);
            // See https://tools.ietf.org/html/rfc7230#section-3.3.2
            // A user agent SHOULD send a Content-Length in a request message when
            // no Transfer-Encoding is sent and the request method defines a meaning
            // for an enclosed payload body.  For example, a Content-Length header
            // field is normally sent in a POST request even when the value is 0
            // (indicating an empty payload body).  A user agent SHOULD NOT send a
            // Content-Length header field when the request message does not contain
            // a payload body and the method semantics do not anticipate such a
            // body.
            if (is_1.default.undefined(headers['content-length']) && is_1.default.undefined(headers['transfer-encoding']) && !cannotHaveBody && !is_1.default.undefined(uploadBodySize)) {
                headers['content-length'] = String(uploadBodySize);
            }
        }
        if (options.responseType === 'json' && !('accept' in options.headers)) {
            options.headers.accept = 'application/json';
        }
        this._bodySize = Number(headers['content-length']) || undefined;
    }
    async _onResponseBase(response) {
        // This will be called e.g. when using cache so we need to check if this request has been aborted.
        if (this.isAborted) {
            return;
        }
        const { options } = this;
        const { url } = options;
        this._nativeResponse = response;
        if (options.decompress) {
            response = (0, decompress_response_1.default)(response);
        }
        const statusCode = response.statusCode;
        const typedResponse = response;
        typedResponse.statusMessage = typedResponse.statusMessage ? typedResponse.statusMessage : http_1.default.STATUS_CODES[statusCode];
        typedResponse.url = options.url.toString();
        typedResponse.requestUrl = this.requestUrl;
        typedResponse.redirectUrls = this.redirectUrls;
        typedResponse.request = this;
        typedResponse.isFromCache = this._nativeResponse.fromCache ?? false;
        typedResponse.ip = this.ip;
        typedResponse.retryCount = this.retryCount;
        typedResponse.ok = (0, response_js_1.isResponseOk)(typedResponse);
        this._isFromCache = typedResponse.isFromCache;
        this._responseSize = Number(response.headers['content-length']) || undefined;
        this.response = typedResponse;
        response.once('end', () => {
            this._responseSize = this._downloadedSize;
            this.emit('downloadProgress', this.downloadProgress);
        });
        response.once('error', (error) => {
            this._aborted = true;
            // Force clean-up, because some packages don't do this.
            // TODO: Fix decompress-response
            response.destroy();
            this._beforeError(new errors_js_1.ReadError(error, this));
        });
        response.once('aborted', () => {
            this._aborted = true;
            this._beforeError(new errors_js_1.ReadError({
                name: 'Error',
                message: 'The server aborted pending request',
                code: 'ECONNRESET',
            }, this));
        });
        this.emit('downloadProgress', this.downloadProgress);
        const rawCookies = response.headers['set-cookie'];
        if (is_1.default.object(options.cookieJar) && rawCookies) {
            let promises = rawCookies.map(async (rawCookie) => options.cookieJar.setCookie(rawCookie, url.toString()));
            if (options.ignoreInvalidCookies) {
                promises = promises.map(async (promise) => {
                    try {
                        await promise;
                    }
                    catch { }
                });
            }
            try {
                await Promise.all(promises);
            }
            catch (error) {
                this._beforeError(error);
                return;
            }
        }
        // The above is running a promise, therefore we need to check if this request has been aborted yet again.
        if (this.isAborted) {
            return;
        }
        if (options.followRedirect && response.headers.location && redirectCodes.has(statusCode)) {
            // We're being redirected, we don't care about the response.
            // It'd be best to abort the request, but we can't because
            // we would have to sacrifice the TCP connection. We don't want that.
            response.resume();
            this._cancelTimeouts();
            this._unproxyEvents();
            if (this.redirectUrls.length >= options.maxRedirects) {
                this._beforeError(new errors_js_1.MaxRedirectsError(this));
                return;
            }
            this._request = undefined;
            const updatedOptions = new options_js_1.default(undefined, undefined, this.options);
            const serverRequestedGet = statusCode === 303 && updatedOptions.method !== 'GET' && updatedOptions.method !== 'HEAD';
            const canRewrite = statusCode !== 307 && statusCode !== 308;
            const userRequestedGet = updatedOptions.methodRewriting && canRewrite;
            if (serverRequestedGet || userRequestedGet) {
                updatedOptions.method = 'GET';
                updatedOptions.body = undefined;
                updatedOptions.json = undefined;
                updatedOptions.form = undefined;
                delete updatedOptions.headers['content-length'];
            }
            try {
                // We need this in order to support UTF-8
                const redirectBuffer = buffer_1.Buffer.from(response.headers.location, 'binary').toString();
                const redirectUrl = new url_1.URL(redirectBuffer, url);
                if (!(0, is_unix_socket_url_js_1.default)(url) && (0, is_unix_socket_url_js_1.default)(redirectUrl)) {
                    this._beforeError(new errors_js_1.RequestError('Cannot redirect to UNIX socket', {}, this));
                    return;
                }
                // Redirecting to a different site, clear sensitive data.
                if (redirectUrl.hostname !== url.hostname || redirectUrl.port !== url.port) {
                    if ('host' in updatedOptions.headers) {
                        delete updatedOptions.headers.host;
                    }
                    if ('cookie' in updatedOptions.headers) {
                        delete updatedOptions.headers.cookie;
                    }
                    if ('authorization' in updatedOptions.headers) {
                        delete updatedOptions.headers.authorization;
                    }
                    if (updatedOptions.username || updatedOptions.password) {
                        updatedOptions.username = '';
                        updatedOptions.password = '';
                    }
                }
                else {
                    redirectUrl.username = updatedOptions.username;
                    redirectUrl.password = updatedOptions.password;
                }
                this.redirectUrls.push(redirectUrl);
                updatedOptions.prefixUrl = '';
                updatedOptions.url = redirectUrl;
                for (const hook of updatedOptions.hooks.beforeRedirect) {
                    // eslint-disable-next-line no-await-in-loop
                    await hook(updatedOptions, typedResponse);
                }
                this.emit('redirect', updatedOptions, typedResponse);
                this.options = updatedOptions;
                await this._makeRequest();
            }
            catch (error) {
                this._beforeError(error);
                return;
            }
            return;
        }
        // `HTTPError`s always have `error.response.body` defined.
        // Therefore we cannot retry if `options.throwHttpErrors` is false.
        // On the last retry, if `options.throwHttpErrors` is false, we would need to return the body,
        // but that wouldn't be possible since the body would be already read in `error.response.body`.
        if (options.isStream && options.throwHttpErrors && !(0, response_js_1.isResponseOk)(typedResponse)) {
            this._beforeError(new errors_js_1.HTTPError(typedResponse));
            return;
        }
        response.on('readable', () => {
            if (this._triggerRead) {
                this._read();
            }
        });
        this.on('resume', () => {
            response.resume();
        });
        this.on('pause', () => {
            response.pause();
        });
        response.once('end', () => {
            this.push(null);
        });
        if (this._noPipe) {
            const success = await this._setRawBody();
            if (success) {
                this.emit('response', response);
            }
            return;
        }
        this.emit('response', response);
        for (const destination of this._pipedServerResponses) {
            if (destination.headersSent) {
                continue;
            }
            // eslint-disable-next-line guard-for-in
            for (const key in response.headers) {
                const isAllowed = options.decompress ? key !== 'content-encoding' : true;
                const value = response.headers[key];
                if (isAllowed) {
                    destination.setHeader(key, value);
                }
            }
            destination.statusCode = statusCode;
        }
    }
    async _setRawBody(from = this) {
        if (from.readableEnded) {
            return false;
        }
        try {
            // Errors are emitted via the `error` event
            const rawBody = await (0, get_stream_1.buffer)(from);
            // On retry Request is destroyed with no error, therefore the above will successfully resolve.
            // So in order to check if this was really successfull, we need to check if it has been properly ended.
            if (!this.isAborted) {
                this.response.rawBody = rawBody;
                return true;
            }
        }
        catch { }
        return false;
    }
    async _onResponse(response) {
        try {
            await this._onResponseBase(response);
        }
        catch (error) {
            /* istanbul ignore next: better safe than sorry */
            this._beforeError(error);
        }
    }
    _onRequest(request) {
        const { options } = this;
        const { timeout, url } = options;
        (0, http_timer_1.default)(request);
        if (this.options.http2) {
            // Unset stream timeout, as the `timeout` option was used only for connection timeout.
            request.setTimeout(0);
        }
        this._cancelTimeouts = (0, timed_out_js_1.default)(request, timeout, url);
        const responseEventName = options.cache ? 'cacheableResponse' : 'response';
        request.once(responseEventName, (response) => {
            void this._onResponse(response);
        });
        request.once('error', (error) => {
            this._aborted = true;
            // Force clean-up, because some packages (e.g. nock) don't do this.
            request.destroy();
            error = error instanceof timed_out_js_1.TimeoutError ? new errors_js_1.TimeoutError(error, this.timings, this) : new errors_js_1.RequestError(error.message, error, this);
            this._beforeError(error);
        });
        this._unproxyEvents = (0, proxy_events_js_1.default)(request, this, proxiedRequestEvents);
        this._request = request;
        this.emit('uploadProgress', this.uploadProgress);
        this._sendBody();
        this.emit('request', request);
    }
    async _asyncWrite(chunk) {
        return new Promise((resolve, reject) => {
            super.write(chunk, error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
    _sendBody() {
        // Send body
        const { body } = this.options;
        const currentRequest = this.redirectUrls.length === 0 ? this : this._request ?? this;
        if (is_1.default.nodeStream(body)) {
            body.pipe(currentRequest);
        }
        else if (is_1.default.generator(body) || is_1.default.asyncGenerator(body)) {
            (async () => {
                try {
                    for await (const chunk of body) {
                        await this._asyncWrite(chunk);
                    }
                    super.end();
                }
                catch (error) {
                    this._beforeError(error);
                }
            })();
        }
        else if (!is_1.default.undefined(body)) {
            this._writeRequest(body, undefined, () => { });
            currentRequest.end();
        }
        else if (this._cannotHaveBody || this._noPipe) {
            currentRequest.end();
        }
    }
    _prepareCache(cache) {
        if (!cacheableStore.has(cache)) {
            cacheableStore.set(cache, new cacheable_request_1.default(((requestOptions, handler) => {
                const result = requestOptions._request(requestOptions, handler);
                // TODO: remove this when `cacheable-request` supports async request functions.
                if (is_1.default.promise(result)) {
                    // We only need to implement the error handler in order to support HTTP2 caching.
                    // The result will be a promise anyway.
                    // @ts-expect-error ignore
                    // eslint-disable-next-line @typescript-eslint/promise-function-async
                    result.once = (event, handler) => {
                        if (event === 'error') {
                            (async () => {
                                try {
                                    await result;
                                }
                                catch (error) {
                                    handler(error);
                                }
                            })();
                        }
                        else if (event === 'abort') {
                            // The empty catch is needed here in case when
                            // it rejects before it's `await`ed in `_makeRequest`.
                            (async () => {
                                try {
                                    const request = (await result);
                                    request.once('abort', handler);
                                }
                                catch { }
                            })();
                        }
                        else {
                            /* istanbul ignore next: safety check */
                            throw new Error(`Unknown HTTP2 promise event: ${event}`);
                        }
                        return result;
                    };
                }
                return result;
            }), cache));
        }
    }
    async _createCacheableRequest(url, options) {
        return new Promise((resolve, reject) => {
            // TODO: Remove `utils/url-to-options.ts` when `cacheable-request` is fixed
            Object.assign(options, (0, url_to_options_js_1.default)(url));
            let request;
            // TODO: Fix `cacheable-response`. This is ugly.
            const cacheRequest = cacheableStore.get(options.cache)(options, async (response) => {
                response._readableState.autoDestroy = false;
                if (request) {
                    const fix = () => {
                        if (response.req) {
                            response.complete = response.req.res.complete;
                        }
                    };
                    response.prependOnceListener('end', fix);
                    fix();
                    (await request).emit('cacheableResponse', response);
                }
                resolve(response);
            });
            cacheRequest.once('error', reject);
            cacheRequest.once('request', async (requestOrPromise) => {
                request = requestOrPromise;
                resolve(request);
            });
        });
    }
    async _makeRequest() {
        const { options } = this;
        const { headers, username, password } = options;
        const cookieJar = options.cookieJar;
        for (const key in headers) {
            if (is_1.default.undefined(headers[key])) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete headers[key];
            }
            else if (is_1.default.null_(headers[key])) {
                throw new TypeError(`Use \`undefined\` instead of \`null\` to delete the \`${key}\` header`);
            }
        }
        if (options.decompress && is_1.default.undefined(headers['accept-encoding'])) {
            headers['accept-encoding'] = supportsBrotli ? 'gzip, deflate, br' : 'gzip, deflate';
        }
        if (username || password) {
            const credentials = buffer_1.Buffer.from(`${username}:${password}`).toString('base64');
            headers.authorization = `Basic ${credentials}`;
        }
        // Set cookies
        if (cookieJar) {
            const cookieString = await cookieJar.getCookieString(options.url.toString());
            if (is_1.default.nonEmptyString(cookieString)) {
                headers.cookie = cookieString;
            }
        }
        // Reset `prefixUrl`
        options.prefixUrl = '';
        let request;
        for (const hook of options.hooks.beforeRequest) {
            // eslint-disable-next-line no-await-in-loop
            const result = await hook(options);
            if (!is_1.default.undefined(result)) {
                // @ts-expect-error Skip the type mismatch to support abstract responses
                request = () => result;
                break;
            }
        }
        if (!request) {
            request = options.getRequestFunction();
        }
        const url = options.url;
        this._requestOptions = options.createNativeRequestOptions();
        if (options.cache) {
            this._requestOptions._request = request;
            this._requestOptions.cache = options.cache;
            this._requestOptions.body = options.body;
            this._prepareCache(options.cache);
        }
        // Cache support
        const fn = options.cache ? this._createCacheableRequest : request;
        try {
            // We can't do `await fn(...)`,
            // because stream `error` event can be emitted before `Promise.resolve()`.
            let requestOrResponse = fn(url, this._requestOptions);
            if (is_1.default.promise(requestOrResponse)) {
                requestOrResponse = await requestOrResponse;
            }
            // Fallback
            if (is_1.default.undefined(requestOrResponse)) {
                requestOrResponse = options.getFallbackRequestFunction()(url, this._requestOptions);
                if (is_1.default.promise(requestOrResponse)) {
                    requestOrResponse = await requestOrResponse;
                }
            }
            if ((0, is_client_request_js_1.default)(requestOrResponse)) {
                this._onRequest(requestOrResponse);
            }
            else if (this.writable) {
                this.once('finish', () => {
                    void this._onResponse(requestOrResponse);
                });
                this._sendBody();
            }
            else {
                void this._onResponse(requestOrResponse);
            }
        }
        catch (error) {
            if (error.name === 'CacheError') {
                throw new errors_js_1.CacheError(error, this);
            }
            throw error;
        }
    }
    async _error(error) {
        try {
            if (error instanceof errors_js_1.HTTPError && !this.options.throwHttpErrors) {
                // This branch can be reached only when using the Promise API
                // Skip calling the hooks on purpose.
                // See https://github.com/sindresorhus/got/issues/2103
            }
            else {
                for (const hook of this.options.hooks.beforeError) {
                    // eslint-disable-next-line no-await-in-loop
                    error = await hook(error);
                }
            }
        }
        catch (error_) {
            error = new errors_js_1.RequestError(error_.message, error_, this);
        }
        this.destroy(error);
    }
    _writeRequest(chunk, encoding, callback) {
        if (!this._request || this._request.destroyed) {
            // Probably the `ClientRequest` instance will throw
            return;
        }
        this._request.write(chunk, encoding, (error) => {
            // The `!destroyed` check is required to prevent `uploadProgress` being emitted after the stream was destroyed
            if (!error && !this._request.destroyed) {
                this._uploadedSize += buffer_1.Buffer.byteLength(chunk, encoding);
                const progress = this.uploadProgress;
                if (progress.percent < 1) {
                    this.emit('uploadProgress', progress);
                }
            }
            callback(error);
        });
    }
    /**
    The remote IP address.
    */
    get ip() {
        return this.socket?.remoteAddress;
    }
    /**
    Indicates whether the request has been aborted or not.
    */
    get isAborted() {
        return this._aborted;
    }
    get socket() {
        return this._request?.socket ?? undefined;
    }
    /**
    Progress event for downloading (receiving a response).
    */
    get downloadProgress() {
        let percent;
        if (this._responseSize) {
            percent = this._downloadedSize / this._responseSize;
        }
        else if (this._responseSize === this._downloadedSize) {
            percent = 1;
        }
        else {
            percent = 0;
        }
        return {
            percent,
            transferred: this._downloadedSize,
            total: this._responseSize,
        };
    }
    /**
    Progress event for uploading (sending a request).
    */
    get uploadProgress() {
        let percent;
        if (this._bodySize) {
            percent = this._uploadedSize / this._bodySize;
        }
        else if (this._bodySize === this._uploadedSize) {
            percent = 1;
        }
        else {
            percent = 0;
        }
        return {
            percent,
            transferred: this._uploadedSize,
            total: this._bodySize,
        };
    }
    /**
    The object contains the following properties:

    - `start` - Time when the request started.
    - `socket` - Time when a socket was assigned to the request.
    - `lookup` - Time when the DNS lookup finished.
    - `connect` - Time when the socket successfully connected.
    - `secureConnect` - Time when the socket securely connected.
    - `upload` - Time when the request finished uploading.
    - `response` - Time when the request fired `response` event.
    - `end` - Time when the response fired `end` event.
    - `error` - Time when the request fired `error` event.
    - `abort` - Time when the request fired `abort` event.
    - `phases`
        - `wait` - `timings.socket - timings.start`
        - `dns` - `timings.lookup - timings.socket`
        - `tcp` - `timings.connect - timings.lookup`
        - `tls` - `timings.secureConnect - timings.connect`
        - `request` - `timings.upload - (timings.secureConnect || timings.connect)`
        - `firstByte` - `timings.response - timings.upload`
        - `download` - `timings.end - timings.response`
        - `total` - `(timings.end || timings.error || timings.abort) - timings.start`

    If something has not been measured yet, it will be `undefined`.

    __Note__: The time is a `number` representing the milliseconds elapsed since the UNIX epoch.
    */
    get timings() {
        return this._request?.timings;
    }
    /**
    Whether the response was retrieved from the cache.
    */
    get isFromCache() {
        return this._isFromCache;
    }
    get reusedSocket() {
        return this._request?.reusedSocket;
    }
}
exports.default = Request;
