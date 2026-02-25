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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLinkHeader = exports.create = exports.calculateRetryDelay = exports.Options = exports.got = void 0;
const create_js_1 = __importDefault(require("./create.js"));
const options_js_1 = __importDefault(require("./core/options.js"));
const defaults = {
    options: new options_js_1.default(),
    handlers: [],
    mutableDefaults: false,
};
const got = (0, create_js_1.default)(defaults);
exports.got = got;
exports.default = got;
var options_js_2 = require("./core/options.js");
Object.defineProperty(exports, "Options", { enumerable: true, get: function () { return __importDefault(options_js_2).default; } });
__exportStar(require("./core/options.js"), exports);
__exportStar(require("./core/response.js"), exports);
__exportStar(require("./core/index.js"), exports);
__exportStar(require("./core/errors.js"), exports);
var calculate_retry_delay_js_1 = require("./core/calculate-retry-delay.js");
Object.defineProperty(exports, "calculateRetryDelay", { enumerable: true, get: function () { return __importDefault(calculate_retry_delay_js_1).default; } });
__exportStar(require("./as-promise/types.js"), exports);
__exportStar(require("./types.js"), exports);
var create_js_2 = require("./create.js");
Object.defineProperty(exports, "create", { enumerable: true, get: function () { return __importDefault(create_js_2).default; } });
var parse_link_header_js_1 = require("./core/parse-link-header.js");
Object.defineProperty(exports, "parseLinkHeader", { enumerable: true, get: function () { return __importDefault(parse_link_header_js_1).default; } });
