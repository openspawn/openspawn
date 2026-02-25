"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripTypeModifiers = stripTypeModifiers;
exports.stripNonNull = stripNonNull;
exports.stripList = stripList;
exports.isNonNull = isNonNull;
exports.isList = isList;
function stripTypeModifiers(type) {
    return type.replaceAll("!", "").replaceAll("[", "").replaceAll("]", "");
}
function stripNonNull(type) {
    return type.replace(/\!$/, "");
}
function stripList(type) {
    return type.replace(/^\[/, "").replace(/\]$/, "");
}
function isNonNull(type) {
    return type.endsWith("!");
}
function isList(type) {
    return type.endsWith("]");
}
