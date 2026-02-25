"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewareGenerator = middlewareGenerator;
const utils_1 = require("../utils");
async function middlewareGenerator(tree, rawOptions) {
    const options = await normalizeMiddlewareOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'middleware', options);
}
exports.default = middlewareGenerator;
async function normalizeMiddlewareOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'middleware',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
