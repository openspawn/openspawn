"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interceptorGenerator = interceptorGenerator;
const utils_1 = require("../utils");
async function interceptorGenerator(tree, rawOptions) {
    const options = await normalizeInterceptorOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'interceptor', options);
}
exports.default = interceptorGenerator;
async function normalizeInterceptorOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'interceptor',
    });
    return {
        ...normalizedOptions,
        language: options.language,
        spec: (0, utils_1.unitTestRunnerToSpec)(options.unitTestRunner),
    };
}
