"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPropertyAssignment = toPropertyAssignment;
exports.toExpression = toExpression;
const ts = require("typescript");
function toPropertyAssignment(key, value) {
    if (typeof value === 'string') {
        return ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(key), ts.factory.createStringLiteral(value));
    }
    else if (typeof value === 'number') {
        return ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(key), ts.factory.createNumericLiteral(value));
    }
    else if (typeof value === 'boolean') {
        return ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(key), value ? ts.factory.createTrue() : ts.factory.createFalse());
    }
    else if (Array.isArray(value)) {
        return ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(key), ts.factory.createArrayLiteralExpression(value.map((item) => toExpression(item))));
    }
    else {
        return ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(key), ts.factory.createObjectLiteralExpression(Object.entries(value).map(([key, value]) => toPropertyAssignment(key, value))));
    }
}
function toExpression(value) {
    if (typeof value === 'string') {
        return ts.factory.createStringLiteral(value);
    }
    else if (typeof value === 'number') {
        return ts.factory.createNumericLiteral(value);
    }
    else if (typeof value === 'boolean') {
        return value ? ts.factory.createTrue() : ts.factory.createFalse();
    }
    else if (Array.isArray(value)) {
        return ts.factory.createArrayLiteralExpression(value.map((item) => toExpression(item)));
    }
    else {
        return ts.factory.createObjectLiteralExpression(Object.entries(value).map(([key, value]) => toPropertyAssignment(key, value)));
    }
}
