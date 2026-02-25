"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEntryPoints = generateEntryPoints;
const normalize_entry_1 = require("./normalize-entry");
function generateEntryPoints(appConfig) {
    // Add all styles/scripts, except lazy-loaded ones.
    const extraEntryPoints = (extraEntryPoints, defaultBundleName) => {
        const entryPoints = (0, normalize_entry_1.normalizeExtraEntryPoints)(extraEntryPoints, defaultBundleName).map((entry) => entry.bundleName);
        // remove duplicates
        return [...new Set(entryPoints)];
    };
    const styleEntryPoints = appConfig.styles.filter((style) => !(typeof style !== 'string' && !style.inject));
    const scriptEntryPoints = appConfig.scripts.filter((script) => !(typeof script !== 'string' && !script.inject));
    const entryPoints = [
        'runtime',
        'polyfills',
        'sw-register',
        ...extraEntryPoints(styleEntryPoints, 'styles'),
        ...extraEntryPoints(scriptEntryPoints, 'scripts'),
        'vendor',
        'main',
    ];
    const duplicates = [
        ...new Set(entryPoints.filter((x) => entryPoints.indexOf(x) !== entryPoints.lastIndexOf(x))),
    ];
    if (duplicates.length > 0) {
        throw new Error(`Multiple bundles have been named the same: '${duplicates.join(`', '`)}'.`);
    }
    return entryPoints;
}
