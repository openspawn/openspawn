"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyWithoutQuotes = stringifyWithoutQuotes;
function stringifyWithoutQuotes(obj, includeSpaces) {
    let result = includeSpaces
        ? JSON.stringify(obj, null, 2)
        : JSON.stringify(obj);
    result = result
        .replace(/"([^"]+)":/g, '$1:')
        .replace(/(?<char>({|,|:))/g, '$<char> ');
    if (!includeSpaces) {
        result = result.replace(/}/g, ' }');
    }
    return result;
}
