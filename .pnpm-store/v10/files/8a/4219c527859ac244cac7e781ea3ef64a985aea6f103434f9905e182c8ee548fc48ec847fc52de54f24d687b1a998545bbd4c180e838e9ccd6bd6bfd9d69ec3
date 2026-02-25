"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelError = void 0;
const errors_js_1 = require("../core/errors.js");
/**
An error to be thrown when the request is aborted with `.cancel()`.
*/
class CancelError extends errors_js_1.RequestError {
    constructor(request) {
        super('Promise was canceled', {}, request);
        this.name = 'CancelError';
        this.code = 'ERR_CANCELED';
    }
    /**
    Whether the promise is canceled.
    */
    get isCanceled() {
        return true;
    }
}
exports.CancelError = CancelError;
