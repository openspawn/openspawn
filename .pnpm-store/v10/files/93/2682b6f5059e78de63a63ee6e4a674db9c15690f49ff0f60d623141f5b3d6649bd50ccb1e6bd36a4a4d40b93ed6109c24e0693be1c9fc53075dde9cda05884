"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOptions = normalizeOptions;
exports.unitTestRunnerToSpec = unitTestRunnerToSpec;
const artifact_name_and_directory_utils_1 = require("@nx/devkit/src/generators/artifact-name-and-directory-utils");
async function normalizeOptions(tree, options, normalizationOptions = {}) {
    const { allowedFileExtensions = ['js', 'ts'], skipLanguageOption = false, suffix, } = normalizationOptions;
    const { directory, artifactName, fileExtension } = await (0, artifact_name_and_directory_utils_1.determineArtifactNameAndDirectoryOptions)(tree, {
        path: options.path,
        allowedFileExtensions,
        fileExtension: options.language === 'js' ? 'js' : 'ts',
        js: options.language ? options.language === 'js' : undefined,
        jsOptionName: 'language',
    });
    options.path = undefined; // Now that we have `directory` we don't need `path`
    if (!skipLanguageOption) {
        // we assign the language based on the normalized file extension
        options.language = fileExtension;
    }
    let name = artifactName;
    if (suffix && artifactName.endsWith(`.${suffix}`)) {
        // strip the suffix if it exists, the nestjs schematic will always add it
        name = artifactName.replace(`.${suffix}`, '');
    }
    return {
        ...options,
        flat: true,
        name,
        sourceRoot: directory,
    };
}
function unitTestRunnerToSpec(unitTestRunner) {
    return unitTestRunner !== undefined ? unitTestRunner === 'jest' : undefined;
}
