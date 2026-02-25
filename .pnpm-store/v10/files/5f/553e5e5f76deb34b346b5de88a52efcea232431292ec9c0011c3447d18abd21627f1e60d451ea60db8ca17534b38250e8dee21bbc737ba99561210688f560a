"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interfaceGenerator = interfaceGenerator;
const utils_1 = require("../utils");
async function interfaceGenerator(tree, rawOptions) {
    const options = await (0, utils_1.normalizeOptions)(tree, rawOptions, {
        allowedFileExtensions: ['ts'],
        skipLanguageOption: true,
        suffix: 'interface',
    });
    return (0, utils_1.runNestSchematic)(tree, 'interface', options);
}
exports.default = interfaceGenerator;
