"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.satisfiesVersionRange = satisfiesVersionRange;
function satisfiesVersionRange(version, range) {
    const [sign, ver] = range.split(" ");
    const versionInRange = parseFloat(ver.replace("v", ""));
    const detectedVersion = parseFloat(version.replace("v", ""));
    if (sign === "<") {
        return detectedVersion < versionInRange;
    }
    if (sign === ">") {
        return detectedVersion > versionInRange;
    }
    return detectedVersion >= versionInRange;
}
