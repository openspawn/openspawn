"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardGenerator = guardGenerator;
const utils_1 = require("../utils");
async function guardGenerator(tree, rawOptions) {
    const options = await normalizeGuardOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'guard', options);
}
exports.default = guardGenerator;
async function normalizeGuardOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'guard',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
