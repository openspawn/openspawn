"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const devkit_1 = require("@nx/devkit");
const tsquery_1 = require("@phenomnomnominal/tsquery");
const jest_1 = require("jest");
const jest_config_1 = require("jest-config");
const jest_runtime_1 = require("jest-runtime");
const path_1 = require("path");
const matcherAliasesMap = new Map([
    ['toBeCalled', 'toHaveBeenCalled'],
    ['toBeCalledTimes', 'toHaveBeenCalledTimes'],
    ['toBeCalledWith', 'toHaveBeenCalledWith'],
    ['lastCalledWith', 'toHaveBeenLastCalledWith'],
    ['nthCalledWith', 'toHaveBeenNthCalledWith'],
    ['toReturn', 'toHaveReturned'],
    ['toReturnTimes', 'toHaveReturnedTimes'],
    ['toReturnWith', 'toHaveReturnedWith'],
    ['lastReturnedWith', 'toHaveLastReturnedWith'],
    ['nthReturnedWith', 'toHaveNthReturnedWith'],
    ['toThrowError', 'toThrow'],
]);
// migration for https://github.com/jestjs/jest/commit/eac241cf0bcb7a808e192e6fcf3afe67edbdbf8e
async function default_1(tree) {
    const testFilePaths = await getTestFilePaths(tree);
    for (const testFilePath of testFilePaths) {
        let testFileContent = tree.read(testFilePath, 'utf-8');
        for (const [alias, matcher] of matcherAliasesMap) {
            testFileContent = (0, tsquery_1.replace)(testFileContent, `CallExpression PropertyAccessExpression:has(CallExpression Identifier[name=expect]) Identifier[name=${alias}]`, (_node) => matcher);
        }
        tree.write(testFilePath, testFileContent);
    }
    await (0, devkit_1.formatFiles)(tree);
}
async function getTestFilePaths(tree) {
    const jestConfigFiles = await (0, devkit_1.globAsync)(tree, [
        '**/jest.config.{cjs,mjs,js,cts,mts,ts}',
    ]);
    if (!jestConfigFiles.length) {
        return [];
    }
    const testFilePaths = new Set();
    for (const jestConfigFile of jestConfigFiles) {
        const jestConfigContent = tree.read(jestConfigFile, 'utf-8');
        if (jestConfigContent.includes('getJestProjectsAsync()')) {
            // skip the root jest config file which includes all projects
            continue;
        }
        const config = await (0, jest_config_1.readConfig)({ _: [], $0: undefined }, (0, path_1.join)(tree.root, jestConfigFile));
        const jestContext = await jest_runtime_1.default.createContext(config.projectConfig, {
            maxWorkers: 1,
            watchman: false,
        });
        const source = new jest_1.SearchSource(jestContext);
        const specs = await source.getTestPaths(config.globalConfig, config.projectConfig);
        for (const testPath of specs.tests) {
            testFilePaths.add(path_1.posix.normalize((0, path_1.relative)(tree.root, testPath.path)));
        }
    }
    return Array.from(testFilePaths);
}
