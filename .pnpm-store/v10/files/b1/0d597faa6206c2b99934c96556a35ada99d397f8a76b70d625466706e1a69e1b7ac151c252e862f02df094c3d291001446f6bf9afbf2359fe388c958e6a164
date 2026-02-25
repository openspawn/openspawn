"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decoratorGenerator = decoratorGenerator;
const utils_1 = require("../utils");
async function decoratorGenerator(tree, rawOptions) {
    const options = await normalizeDecoratorOptions(tree, rawOptions);
    return (0, utils_1.runNestSchematic)(tree, 'decorator', options);
}
exports.default = decoratorGenerator;
async function normalizeDecoratorOptions(tree, options) {
    const normalizedOptions = await (0, utils_1.normalizeOptions)(tree, options, {
        suffix: 'decorator',
    });
    return {
        ...normalizedOptions,
        language: options.language,
    };
}
