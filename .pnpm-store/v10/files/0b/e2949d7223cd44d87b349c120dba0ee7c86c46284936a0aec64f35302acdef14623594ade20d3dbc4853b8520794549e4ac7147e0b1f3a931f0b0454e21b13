"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFiles = createFiles;
const devkit_1 = require("@nx/devkit");
const path_1 = require("path");
function createFiles(tree, options) {
    const substitutions = {
        ...(0, devkit_1.names)(options.projectName),
        ...options,
        tmpl: '',
        offsetFromRoot: (0, devkit_1.offsetFromRoot)(options.projectRoot),
        fileName: options.fileName,
    };
    (0, devkit_1.generateFiles)(tree, (0, path_1.join)(__dirname, '..', 'files', 'common'), options.projectRoot, substitutions);
    if (options.controller) {
        (0, devkit_1.generateFiles)(tree, (0, path_1.join)(__dirname, '..', 'files', 'controller'), options.projectRoot, substitutions);
        if (options.unitTestRunner === 'none') {
            tree.delete((0, devkit_1.joinPathFragments)(options.projectRoot, 'src', 'lib', `${substitutions.fileName}.controller.spec.ts`));
        }
    }
    if (options.service) {
        (0, devkit_1.generateFiles)(tree, (0, path_1.join)(__dirname, '..', 'files', 'service'), options.projectRoot, substitutions);
        if (options.unitTestRunner === 'none') {
            tree.delete((0, devkit_1.joinPathFragments)(options.projectRoot, 'src', 'lib', `${substitutions.fileName}.service.spec.ts`));
        }
    }
}
