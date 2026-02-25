"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOutputDir = deleteOutputDir;
const path = require("path");
const fs_1 = require("fs");
/**
 * Delete an output directory, but error out if it's the root of the project.
 */
function deleteOutputDir(root, outputPath) {
    const resolvedOutputPath = path.resolve(root, outputPath);
    if (resolvedOutputPath === root) {
        throw new Error('Output path MUST not be project root directory!');
    }
    (0, fs_1.rmSync)(resolvedOutputPath, { recursive: true, force: true });
}
