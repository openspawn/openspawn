"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUp = findUp;
exports.findAllNodeModules = findAllNodeModules;
exports.deleteOutputDir = deleteOutputDir;
const path = require("path");
const fs_1 = require("fs");
const fileutils_1 = require("nx/src/utils/fileutils");
function findUp(names, from, stopOnNodeModules = false) {
    if (!Array.isArray(names)) {
        names = [names];
    }
    const root = path.parse(from).root;
    let currentDir = from;
    while (currentDir && currentDir !== root) {
        for (const name of names) {
            const p = path.join(currentDir, name);
            if ((0, fs_1.existsSync)(p)) {
                return p;
            }
        }
        if (stopOnNodeModules) {
            const nodeModuleP = path.join(currentDir, 'node_modules');
            if ((0, fs_1.existsSync)(nodeModuleP)) {
                return null;
            }
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}
function findAllNodeModules(from, root) {
    const nodeModules = [];
    let current = from;
    while (current && current !== root) {
        const potential = path.join(current, 'node_modules');
        if ((0, fileutils_1.directoryExists)(potential)) {
            nodeModules.push(potential);
        }
        const next = path.dirname(current);
        if (next === current) {
            break;
        }
        current = next;
    }
    return nodeModules;
}
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
