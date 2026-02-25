"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptions = normalizeOptions;
exports.toNodeApplicationGeneratorOptions = toNodeApplicationGeneratorOptions;
const devkit_1 = require("@nx/devkit");
const project_name_and_root_utils_1 = require("@nx/devkit/src/generators/project-name-and-root-utils");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
async function normalizeOptions(tree, options) {
    await (0, project_name_and_root_utils_1.ensureRootProjectName)(options, 'application');
    const { projectName: appProjectName, projectRoot: appProjectRoot } = await (0, project_name_and_root_utils_1.determineProjectNameAndRootOptions)(tree, {
        name: options.name,
        projectType: 'application',
        directory: options.directory,
        rootProject: options.rootProject,
    });
    options.rootProject = appProjectRoot === '.';
    const nxJson = (0, devkit_1.readNxJson)(tree);
    const addPlugin = process.env.NX_ADD_PLUGINS !== 'false' &&
        nxJson.useInferencePlugins !== false;
    return {
        addPlugin,
        ...options,
        strict: options.strict ?? false,
        appProjectName,
        appProjectRoot,
        linter: options.linter ?? 'eslint',
        unitTestRunner: options.unitTestRunner ?? 'jest',
        e2eTestRunner: options.e2eTestRunner ?? 'jest',
        useProjectJson: options.useProjectJson ?? !(0, ts_solution_setup_1.isUsingTsSolutionSetup)(tree),
    };
}
function toNodeApplicationGeneratorOptions(options) {
    return {
        name: options.name,
        directory: options.directory,
        frontendProject: options.frontendProject,
        linter: options.linter,
        skipFormat: true,
        skipPackageJson: options.skipPackageJson,
        standaloneConfig: options.standaloneConfig,
        tags: options.tags,
        unitTestRunner: options.unitTestRunner,
        e2eTestRunner: options.e2eTestRunner,
        setParserOptionsProject: options.setParserOptionsProject,
        rootProject: options.rootProject,
        bundler: 'webpack', // Some features require webpack plugins such as TS transformers
        isNest: true,
        addPlugin: options.addPlugin,
        useProjectJson: options.useProjectJson,
    };
}
