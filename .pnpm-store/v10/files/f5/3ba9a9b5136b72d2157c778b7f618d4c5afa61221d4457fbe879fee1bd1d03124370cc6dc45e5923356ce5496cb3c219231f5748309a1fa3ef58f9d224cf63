"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFiles = createFiles;
const devkit_1 = require("@nx/devkit");
const path_1 = require("path");
function createFiles(tree, options) {
    (0, devkit_1.generateFiles)(tree, (0, path_1.join)(__dirname, '..', 'files', 'common'), (0, path_1.join)(options.appProjectRoot, 'src'), {
        tmpl: '',
        name: options.appProjectName,
        root: options.appProjectRoot,
    });
    if (options.unitTestRunner === 'jest') {
        (0, devkit_1.generateFiles)(tree, (0, path_1.join)(__dirname, '..', 'files', 'test'), (0, path_1.join)(options.appProjectRoot, 'src'), {
            tmpl: '',
        });
    }
}
