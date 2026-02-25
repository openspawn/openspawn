"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipeGenerator = pipeGenerator;
const utils_1 = require("../utils");
async function pipeGenerator(tree, rawOptions) {
    const options = await normalizePipeOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'pipe', options);
}
exports.default = pipeGenerator;
async function normalizePipeOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'pipe',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
