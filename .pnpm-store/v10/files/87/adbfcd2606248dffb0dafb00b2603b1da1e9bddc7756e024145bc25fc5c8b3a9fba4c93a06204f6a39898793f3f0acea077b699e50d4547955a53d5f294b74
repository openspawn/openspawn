"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitestExecutor = vitestExecutor;
const devkit_1 = require("@nx/devkit");
const devkit_2 = require("@nx/devkit");
const versions_1 = require("../../utils/versions");
/**
 * @deprecated Use `@nx/vitest:test` instead. This executor will be removed in Nx 23.
 */
async function* vitestExecutor(options, context) {
    devkit_1.logger.warn(`The '@nx/vite:test' executor is deprecated. Please use '@nx/vitest:test' instead. This executor will be removed in Nx 23.`);
    (0, devkit_2.ensurePackage)('@nx/vitest', versions_1.nxVersion);
    const { vitestExecutor: actualVitestExecutor } = await Promise.resolve().then(() => require('@nx/vitest/executors'));
    return yield* actualVitestExecutor(options, context);
}
exports.default = vitestExecutor;
