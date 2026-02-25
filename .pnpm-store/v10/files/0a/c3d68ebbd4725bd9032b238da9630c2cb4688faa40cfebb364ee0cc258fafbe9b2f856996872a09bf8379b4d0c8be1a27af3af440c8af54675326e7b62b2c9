"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLinting = addLinting;
exports.isEslintInstalled = isEslintInstalled;
const devkit_1 = require("@nx/devkit");
const eslint_1 = require("@nx/eslint");
const eslint_file_1 = require("@nx/eslint/src/generators/utils/eslint-file");
const flat_config_1 = require("@nx/eslint/src/utils/flat-config");
const devkit_2 = require("@nx/devkit");
const add_swc_dependencies_1 = require("@nx/js/src/utils/swc/add-swc-dependencies");
const lint_1 = require("../../../utils/lint");
const versions_1 = require("../../../utils/versions");
async function addLinting(host, options) {
    const tasks = [];
    if (options.linter === 'eslint') {
        const lintTask = await (0, eslint_1.lintProjectGenerator)(host, {
            linter: options.linter,
            project: options.projectName,
            tsConfigPaths: [
                (0, devkit_1.joinPathFragments)(options.appProjectRoot, 'tsconfig.app.json'),
            ],
            unitTestRunner: options.unitTestRunner,
            skipFormat: true,
            rootProject: options.rootProject,
            skipPackageJson: options.skipPackageJson,
            addPlugin: options.addPlugin,
        });
        tasks.push(lintTask);
        if ((0, eslint_file_1.isEslintConfigSupported)(host)) {
            if ((0, flat_config_1.useFlatConfig)(host)) {
                (0, eslint_file_1.addPredefinedConfigToFlatLintConfig)(host, options.appProjectRoot, 'flat/react');
                // Add an empty rules object to users know how to add/override rules
                (0, eslint_file_1.addOverrideToLintConfig)(host, options.appProjectRoot, {
                    files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                    rules: {},
                });
            }
            else {
                const addExtendsTask = (0, eslint_file_1.addExtendsToLintConfig)(host, options.appProjectRoot, { name: 'plugin:@nx/react', needCompatFixup: true });
                tasks.push(addExtendsTask);
            }
        }
        if (!options.skipPackageJson) {
            const installTask = (0, devkit_2.addDependenciesToPackageJson)(host, lint_1.extraEslintDependencies.dependencies, lint_1.extraEslintDependencies.devDependencies);
            const addSwcTask = (0, add_swc_dependencies_1.addSwcDependencies)(host);
            tasks.push(installTask, addSwcTask);
        }
        if (options.useReactRouter) {
            await ignoreReactRouterFilesInEslintConfig(host, options.appProjectRoot);
        }
    }
    return (0, devkit_2.runTasksInSerial)(...tasks);
}
async function ignoreReactRouterFilesInEslintConfig(tree, projectRoot) {
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
    addIgnoresToLintConfig(tree, directory, ['**/build', '**/.react-router']);
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
