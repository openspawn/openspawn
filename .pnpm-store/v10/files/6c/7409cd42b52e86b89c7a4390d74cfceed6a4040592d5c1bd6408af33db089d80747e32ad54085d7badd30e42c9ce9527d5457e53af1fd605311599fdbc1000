"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProjectRelativePath = toProjectRelativePath;
const posix_1 = require("path/posix");
const devkit_1 = require("@nx/devkit");
function toProjectRelativePath(path, projectRoot) {
    if (projectRoot === '.') {
        // workspace and project root are the same, we normalize it to ensure it
        return path.startsWith('.') ? path : `./${path}`;
    }
    const relativePath = (0, posix_1.relative)((0, posix_1.resolve)(devkit_1.workspaceRoot, projectRoot), (0, posix_1.resolve)(devkit_1.workspaceRoot, path));
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}
