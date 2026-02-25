"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectScope = void 0;
const devkit_1 = require("@nx/devkit");
/**
 * Retrieves the scope of npm project in the package.json file.
 *
 * @param tree the project tree
 */
const getProjectScope = (tree) => {
    const { name: packageName } = (0, devkit_1.readJson)(tree, 'package.json');
    return packageName.split('/')[0].replace('@', '');
};
exports.getProjectScope = getProjectScope;
//# sourceMappingURL=npm-bridge.js.map