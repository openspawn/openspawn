"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceGenerator = serviceGenerator;
const utils_1 = require("../utils");
async function serviceGenerator(tree, rawOptions) {
    const options = await normalizeServiceOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'service', options);
}
exports.default = serviceGenerator;
async function normalizeServiceOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'service',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
