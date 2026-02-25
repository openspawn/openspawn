"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ignoreViteTempFiles = ignoreViteTempFiles;
exports.addViteTempFilesToGitIgnore = addViteTempFilesToGitIgnore;
exports.isEslintInstalled = isEslintInstalled;
const devkit_1 = require("@nx/devkit");
const versions_1 = require("./versions");
async function ignoreViteTempFiles(tree, projectRoot) {
    addViteTempFilesToGitIgnore(tree);
    await ignoreViteTempFilesInEslintConfig(tree, projectRoot);
}
function addViteTempFilesToGitIgnore(tree) {
    let gitIgnoreContents = tree.exists('.gitignore')
        ? tree.read('.gitignore', 'utf-8')
        : '';
    if (!/^vite\.config\.\*\.timestamp\*$/m.test(gitIgnoreContents)) {
        gitIgnoreContents = (0, devkit_1.stripIndents) `${gitIgnoreContents}
      vite.config.*.timestamp*`;
    }
    tree.write('.gitignore', gitIgnoreContents);
}
async function ignoreViteTempFilesInEslintConfig(tree, projectRoot) {
    if (!isEslintInstalled(tree)) {
        return;
    }
    (0, devkit_1.ensurePackage)('@nx/eslint', versions_1.nxVersion);
    const { addIgnoresToLintConfig, isEslintConfigSupported } = await Promise.resolve().then(() => require('@nx/eslint/src/generators/utils/eslint-file'));
    if (!isEslintConfigSupported(tree)) {
        return;
    }
    const { useFlatConfig } = await Promise.resolve().then(() => require('@nx/eslint/src/utils/flat-config'));
    const isUsingFlatConfig = useFlatConfig(tree);
    if (!projectRoot && !isUsingFlatConfig) {
        // root eslintrc files ignore all files and the root eslintrc files add
        // back all the project files, so we only add the ignores to the project
        // eslintrc files
        return;
    }
    // for flat config, we update the root config file
    const directory = isUsingFlatConfig ? '' : (projectRoot ?? '');
    addIgnoresToLintConfig(tree, directory, ['**/vite.config.*.timestamp*']);
}
function isEslintInstalled(tree) {
    try {
        require('eslint');
        return true;
    }
    catch { }
    // it might not be installed yet, but it might be in the tree pending install
    const { devDependencies, dependencies } = tree.exists('package.json')
        ? (0, devkit_1.readJson)(tree, 'package.json')
        : {};
    return !!devDependencies?.['eslint'] || !!dependencies?.['eslint'];
}
