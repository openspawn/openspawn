"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceGenerator = resourceGenerator;
const utils_1 = require("../utils");
async function resourceGenerator(tree, rawOptions) {
    const options = await normalizeResourceOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'resource', options);
}
exports.default = resourceGenerator;
async function normalizeResourceOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        skipLanguageOption: true,
    });
    return {
        ...normalizedOptions,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
