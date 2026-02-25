"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classGenerator = classGenerator;
const utils_1 = require("../utils");
async function classGenerator(tree, rawOptions) {
    const options = await normalizeClassOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'class', options);
}
exports.default = classGenerator;
async function normalizeClassOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options);
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
