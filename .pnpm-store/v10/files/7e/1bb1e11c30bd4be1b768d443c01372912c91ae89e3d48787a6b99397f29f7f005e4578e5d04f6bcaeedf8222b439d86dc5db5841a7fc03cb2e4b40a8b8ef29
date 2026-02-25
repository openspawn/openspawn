"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const util_1 = require("util");
const is_1 = __importDefault(require("@sindresorhus/is"));
const is_form_data_js_1 = __importDefault(require("./is-form-data.js"));
async function getBodySize(body, headers) {
    if (headers && 'content-length' in headers) {
        return Number(headers['content-length']);
    }
    if (!body) {
        return 0;
    }
    if (is_1.default.string(body)) {
        return buffer_1.Buffer.byteLength(body);
    }
    if (is_1.default.buffer(body)) {
        return body.length;
    }
    if ((0, is_form_data_js_1.default)(body)) {
        return (0, util_1.promisify)(body.getLength.bind(body))();
    }
    return undefined;
}
exports.default = getBodySize;
