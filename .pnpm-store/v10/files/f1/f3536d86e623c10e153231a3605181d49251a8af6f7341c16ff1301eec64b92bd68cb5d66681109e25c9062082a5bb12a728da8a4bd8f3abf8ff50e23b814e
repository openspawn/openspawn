"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitestGenerator = vitestGenerator;
const devkit_1 = require("@nx/devkit");
const devkit_2 = require("@nx/devkit");
const versions_1 = require("../../utils/versions");
/**
 * @deprecated Use `@nx/vitest:configuration` instead. This generator will be removed in Nx 23.
 */
async function vitestGenerator(tree, schema, hasPlugin = false, suppressDeprecationWarning = false) {
    if (!suppressDeprecationWarning) {
        devkit_1.logger.warn(`The '@nx/vite:vitest' generator is deprecated. Please use '@nx/vitest:configuration' instead. This generator will be removed in Nx 23.`);
    }
    (0, devkit_2.ensurePackage)('@nx/vitest', versions_1.nxVersion);
    const { configurationGenerator } = await Promise.resolve().then(() => require('@nx/vitest/generators'));
    return await configurationGenerator(tree, schema, hasPlugin);
}
exports.default = vitestGenerator;
