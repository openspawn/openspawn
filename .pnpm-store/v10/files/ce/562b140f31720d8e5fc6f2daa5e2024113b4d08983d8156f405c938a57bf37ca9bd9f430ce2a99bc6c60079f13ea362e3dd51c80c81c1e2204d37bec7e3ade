"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRsbuildPlugin = hasRsbuildPlugin;
const devkit_1 = require("@nx/devkit");
const versions_1 = require("./versions");
async function hasRsbuildPlugin(tree, projectPath) {
    (0, devkit_1.ensurePackage)('@nx/rsbuild', versions_1.nxVersion);
    const { hasRsbuildPlugin } = await Promise.resolve().then(() => require('@nx/rsbuild/config-utils'));
    return hasRsbuildPlugin(tree, projectPath);
}
