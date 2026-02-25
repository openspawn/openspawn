"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gatewayGenerator = gatewayGenerator;
const utils_1 = require("../utils");
async function gatewayGenerator(tree, rawOptions) {
    const options = await normalizeGatewayOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'gateway', options);
}
exports.default = gatewayGenerator;
async function normalizeGatewayOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'gateway',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
