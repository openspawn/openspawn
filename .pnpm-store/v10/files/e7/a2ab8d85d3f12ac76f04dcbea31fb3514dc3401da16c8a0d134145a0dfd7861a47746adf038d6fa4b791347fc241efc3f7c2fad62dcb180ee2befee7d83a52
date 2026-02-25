"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptions = normalizeOptions;
exports.toJsLibraryGeneratorOptions = toJsLibraryGeneratorOptions;
const devkit_1 = require("@nx/devkit");
const project_name_and_root_utils_1 = require("@nx/devkit/src/generators/project-name-and-root-utils");
const get_npm_scope_1 = require("@nx/js/src/utils/package-json/get-npm-scope");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
async function normalizeOptions(tree, options) {
    await (0, project_name_and_root_utils_1.ensureRootProjectName)(options, 'library');
    const { projectName, names: projectNames, projectRoot, importPath, } = await (0, project_name_and_root_utils_1.determineProjectNameAndRootOptions)(tree, {
        name: options.name,
        projectType: 'library',
        directory: options.directory,
        importPath: options.importPath,
    });
    const nxJson = (0, devkit_1.readNxJson)(tree);
    const addPlugin = process.env.NX_ADD_PLUGINS !== 'false' &&
        nxJson.useInferencePlugins !== false;
    options.addPlugin ??= addPlugin;
    const fileName = projectNames.projectFileName;
    const parsedTags = options.tags
        ? options.tags.split(',').map((s) => s.trim())
        : [];
    // this helper is called before the jsLibraryGenerator is called, so, if the
    // TS solution setup is not configured, we additionally check if the TS
    // solution setup will be configured by the jsLibraryGenerator
    const isUsingTsSolutionsConfig = (0, ts_solution_setup_1.isUsingTsSolutionSetup)(tree) ||
        (0, ts_solution_setup_1.shouldConfigureTsSolutionSetup)(tree, addPlugin);
    const normalized = {
        ...options,
        strict: options.strict ?? true,
        controller: options.controller ?? false,
        fileName,
        global: options.global ?? false,
        linter: options.linter ?? 'eslint',
        parsedTags,
        prefix: (0, get_npm_scope_1.getNpmScope)(tree), // we could also allow customizing this
        projectName: isUsingTsSolutionsConfig && !options.name ? importPath : projectName,
        projectRoot,
        importPath,
        service: options.service ?? false,
        target: options.target ?? 'es6',
        testEnvironment: options.testEnvironment ?? 'node',
        unitTestRunner: options.unitTestRunner ?? 'jest',
        isUsingTsSolutionsConfig,
        useProjectJson: options.useProjectJson ?? !isUsingTsSolutionsConfig,
    };
    return normalized;
}
function toJsLibraryGeneratorOptions(options) {
    return {
        name: options.name,
        bundler: options.buildable || options.publishable ? 'tsc' : 'none',
        directory: options.directory,
        importPath: options.importPath,
        linter: options.linter,
        publishable: options.publishable,
        skipFormat: true,
        skipTsConfig: options.skipTsConfig,
        skipPackageJson: options.skipPackageJson,
        strict: options.strict,
        tags: options.tags,
        testEnvironment: options.testEnvironment,
        unitTestRunner: options.unitTestRunner,
        setParserOptionsProject: options.setParserOptionsProject,
        addPlugin: options.addPlugin,
        useProjectJson: options.useProjectJson,
    };
}
