"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterGenerator = filterGenerator;
const utils_1 = require("../utils");
async function filterGenerator(tree, rawOptions) {
    const options = await normalizeFilterOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'filter', options);
}
exports.default = filterGenerator;
async function normalizeFilterOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'filter',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
