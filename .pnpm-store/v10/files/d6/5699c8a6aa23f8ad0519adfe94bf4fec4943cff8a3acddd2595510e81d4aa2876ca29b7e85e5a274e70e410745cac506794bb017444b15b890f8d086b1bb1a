"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const devkit_1 = require("@nx/devkit");
const ignore_vite_temp_files_1 = require("../../utils/ignore-vite-temp-files");
const versions_1 = require("../../utils/versions");
async function default_1(tree) {
    if (!(0, ignore_vite_temp_files_1.isEslintInstalled)(tree)) {
        return;
    }
    (0, devkit_1.ensurePackage)('@nx/eslint', versions_1.nxVersion);
    const { addIgnoresToLintConfig, isEslintConfigSupported } = await Promise.resolve().then(() => require('@nx/eslint/src/generators/utils/eslint-file'));
    if (!isEslintConfigSupported(tree)) {
        return;
    }
    const { useFlatConfig } = await Promise.resolve().then(() => require('@nx/eslint/src/utils/flat-config'));
    const isUsingFlatConfig = useFlatConfig(tree);
    if (isUsingFlatConfig) {
        // using flat config, so we update the root eslint config
        addIgnoresToLintConfig(tree, '', [
            '**/vite.config.*.timestamp*',
            '**/vitest.config.*.timestamp*',
        ]);
    }
    else {
        // not using flat config, so we update each project's eslint config
        const projects = (0, devkit_1.getProjects)(tree);
        for (const [, { root: projectRoot }] of projects) {
            const viteConfigFiles = await (0, devkit_1.globAsync)(tree, [
                `${projectRoot}/**/{vite,vitest}.config.{js,ts,mjs,mts,cjs,cts}`,
            ]);
            if (!viteConfigFiles.length) {
                // the project doesn't use vite or vitest, so we skip it
                continue;
            }
            addIgnoresToLintConfig(tree, projectRoot, [
                '**/vite.config.*.timestamp*',
                '**/vitest.config.*.timestamp*',
            ]);
        }
    }
    await (0, devkit_1.formatFiles)(tree);
}
