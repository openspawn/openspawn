"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerGenerator = providerGenerator;
const utils_1 = require("../utils");
async function providerGenerator(tree, rawOptions) {
    const options = await normalizeProviderOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'provider', options);
}
exports.default = providerGenerator;
async function normalizeProviderOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options);
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
