"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolverGenerator = resolverGenerator;
const utils_1 = require("../utils");
async function resolverGenerator(tree, rawOptions) {
    const options = await normalizeResolverOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'resolver', options);
}
exports.default = resolverGenerator;
async function normalizeResolverOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'resolver',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
