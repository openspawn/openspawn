"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeExtraEntryPoints = normalizeExtraEntryPoints;
function normalizeExtraEntryPoints(extraEntryPoints, defaultBundleName) {
    return extraEntryPoints.map((entry) => {
        let normalizedEntry;
        if (typeof entry === 'string') {
            normalizedEntry = {
                input: entry,
                inject: true,
                bundleName: defaultBundleName,
            };
        }
        else {
            const { inject = true, ...newEntry } = entry;
            let bundleName;
            if (entry.bundleName) {
                bundleName = entry.bundleName;
            }
            else {
                bundleName = defaultBundleName;
            }
            normalizedEntry = { ...newEntry, bundleName };
        }
        return normalizedEntry;
    });
}
