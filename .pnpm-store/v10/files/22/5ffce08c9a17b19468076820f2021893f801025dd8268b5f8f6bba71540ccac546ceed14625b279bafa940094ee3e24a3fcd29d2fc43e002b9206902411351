"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDefined = isDefined;
exports.ensureValue = ensureValue;
exports.mathMax = mathMax;
exports.mathMaxNullable = mathMaxNullable;
exports.nullableArrayUnion = nullableArrayUnion;
function isDefined(value) {
    return value !== undefined && value !== null;
}
function ensureValue(value, message) {
    if (isDefined(value)) {
        return value;
    }
    throw new Error(message);
}
function mathMax(firstValue, secondValue) {
    if (secondValue === null) {
        return firstValue;
    }
    return Math.max(firstValue, secondValue);
}
function mathMaxNullable(left, right) {
    if (typeof left === "number") {
        return mathMax(left, right ?? null);
    }
    if (typeof right === "number") {
        return mathMax(right, left ?? null);
    }
    return null;
}
function nullableArrayUnion(left, right) {
    if (!Array.isArray(left) && !Array.isArray(right)) {
        return null;
    }
    const uniqueSet = new Set();
    if (Array.isArray(left)) {
        left.forEach((v) => uniqueSet.add(v));
    }
    if (Array.isArray(right)) {
        right.forEach((v) => uniqueSet.add(v));
    }
    return Array.from(uniqueSet);
}
