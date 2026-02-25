"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_1 = __importDefault(require("@sindresorhus/is"));
function isFormData(body) {
    return is_1.default.nodeStream(body) && is_1.default.function_(body.getBoundary);
}
exports.default = isFormData;
