"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.controllerGenerator = controllerGenerator;
const utils_1 = require("../utils");
async function controllerGenerator(tree, rawOptions) {
    const options = await normalizeControllerOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'controller', options);
}
exports.default = controllerGenerator;
async function normalizeControllerOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'controller',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        module: options.module,
        skipImport: options.skipImport,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
