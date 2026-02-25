"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDependenciesInstalled = checkDependenciesInstalled;
exports.moveToDevDependencies = moveToDevDependencies;
const devkit_1 = require("@nx/devkit");
const versions_1 = require("../../../utils/versions");
const version_utils_1 = require("../../../utils/version-utils");
async function checkDependenciesInstalled(host, schema) {
    const { vitest } = await (0, version_utils_1.getVitestDependenciesVersionsToInstall)(host);
    return (0, devkit_1.addDependenciesToPackageJson)(host, {}, {
        '@nx/vite': versions_1.nxVersion,
        '@nx/web': versions_1.nxVersion,
        vite: schema.useViteV5
            ? versions_1.viteV5Version
            : schema.useViteV6
                ? versions_1.viteV6Version
                : versions_1.viteVersion,
        vitest: vitest,
        '@vitest/ui': vitest,
        jiti: versions_1.jitiVersion,
    }, undefined, schema.keepExistingVersions);
}
function moveToDevDependencies(tree) {
    let wasUpdated = false;
    (0, devkit_1.updateJson)(tree, 'package.json', (packageJson) => {
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        if (packageJson.dependencies['@nx/vite']) {
            packageJson.devDependencies['@nx/vite'] =
                packageJson.dependencies['@nx/vite'];
            delete packageJson.dependencies['@nx/vite'];
            wasUpdated = true;
        }
        return packageJson;
    });
    return wasUpdated ? () => (0, devkit_1.installPackagesTask)(tree) : () => { };
}
