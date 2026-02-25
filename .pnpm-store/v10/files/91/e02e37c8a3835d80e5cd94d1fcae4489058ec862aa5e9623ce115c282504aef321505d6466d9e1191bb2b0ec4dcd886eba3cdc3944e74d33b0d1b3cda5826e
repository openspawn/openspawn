"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleGenerator = moduleGenerator;
const utils_1 = require("../utils");
async function moduleGenerator(tree, rawOptions) {
    const options = await normalizeModuleOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'module', options);
}
exports.default = moduleGenerator;
async function normalizeModuleOptions(tree, options) {
    const normalizedOption = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'module',
    });
    return {
        ...normalizedOption,
        language: options.language,
        module: options.module,
        skipImport: options.skipImport,
    };
}
