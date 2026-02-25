"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webpackInitGenerator = webpackInitGenerator;
exports.webpackInitGeneratorInternal = webpackInitGeneratorInternal;
const devkit_1 = require("@nx/devkit");
const add_plugin_1 = require("@nx/devkit/src/utils/add-plugin");
const plugin_1 = require("../../plugins/plugin");
const versions_1 = require("../../utils/versions");
function webpackInitGenerator(tree, schema) {
    return webpackInitGeneratorInternal(tree, { addPlugin: false, ...schema });
}
async function webpackInitGeneratorInternal(tree, schema) {
    const nxJson = (0, devkit_1.readNxJson)(tree);
    const addPluginDefault = process.env.NX_ADD_PLUGINS !== 'false' &&
        nxJson.useInferencePlugins !== false;
    schema.addPlugin ??= addPluginDefault;
    if (schema.addPlugin) {
        await (0, add_plugin_1.addPlugin)(tree, await (0, devkit_1.createProjectGraphAsync)(), '@nx/webpack/plugin', plugin_1.createNodesV2, {
            buildTargetName: [
                'build',
                'webpack:build',
                'build:webpack',
                'webpack-build',
                'build-webpack',
            ],
            serveTargetName: [
                'serve',
                'webpack:serve',
                'serve:webpack',
                'webpack-serve',
                'serve-webpack',
            ],
            previewTargetName: [
                'preview',
                'webpack:preview',
                'preview:webpack',
                'webpack-preview',
                'preview-webpack',
            ],
            buildDepsTargetName: [
                'build-deps',
                'webpack:build-deps',
                'webpack-build-deps',
            ],
            watchDepsTargetName: [
                'watch-deps',
                'webpack:watch-deps',
                'webpack-watch-deps',
            ],
            serveStaticTargetName: [
                'serve-static',
                'webpack:serve-static',
                'serve-static:webpack',
                'webpack-serve-static',
                'serve-static-webpack',
            ],
        }, schema.updatePackageScripts);
    }
    let installTask = () => { };
    if (!schema.skipPackageJson) {
        const devDependencies = {
            '@nx/webpack': versions_1.nxVersion,
            '@nx/web': versions_1.nxVersion,
        };
        if (schema.addPlugin) {
            devDependencies['webpack-cli'] = versions_1.webpackCliVersion;
        }
        installTask = (0, devkit_1.addDependenciesToPackageJson)(tree, {}, devDependencies, undefined, schema.keepExistingVersions);
    }
    if (!schema.skipFormat) {
        await (0, devkit_1.formatFiles)(tree);
    }
    return installTask;
}
exports.default = webpackInitGenerator;
