"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratePackageJsonPlugin = void 0;
const fs = require("fs");
const webpack_1 = require("webpack");
const js_1 = require("@nx/js");
const devkit_1 = require("@nx/devkit");
const pluginName = 'GeneratePackageJsonPlugin';
class GeneratePackageJsonPlugin {
    constructor(options) {
        this.options = options;
    }
    resolveRuntimeDependencies() {
        const runtimeDependencies = {};
        if (this.options.runtimeDependencies) {
            for (const dep of this.options.runtimeDependencies) {
                const depPkgJson = require.resolve(`${dep}/package.json`);
                if (!fs.existsSync(depPkgJson))
                    continue;
                const { name, version } = (0, devkit_1.readJsonFile)(depPkgJson);
                runtimeDependencies[name] = version;
            }
        }
        return runtimeDependencies;
    }
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tap({
                name: pluginName,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, () => {
                const helperDependencies = (0, js_1.getHelperDependenciesFromProjectGraph)(this.options.root, this.options.projectName, this.options.projectGraph);
                const importHelpers = !!(0, js_1.readTsConfig)(this.options.tsConfig).options
                    .importHelpers;
                const shouldAddHelperDependency = importHelpers &&
                    helperDependencies.every((dep) => dep.target !== js_1.HelperDependency.tsc);
                if (shouldAddHelperDependency) {
                    helperDependencies.push({
                        type: 'static',
                        source: this.options.projectName,
                        target: js_1.HelperDependency.tsc,
                    });
                }
                const runtimeDependencies = this.resolveRuntimeDependencies();
                const packageJson = (0, js_1.createPackageJson)(this.options.projectName, this.options.projectGraph, {
                    target: this.options.targetName,
                    root: this.options.root,
                    isProduction: true,
                    helperDependencies: helperDependencies.map((dep) => dep.target),
                    skipPackageManager: this.options.skipPackageManager,
                });
                packageJson.main = packageJson.main ?? this.options.outputFileName;
                packageJson.dependencies = {
                    ...packageJson.dependencies,
                    ...runtimeDependencies,
                };
                compilation.emitAsset('package.json', new webpack_1.sources.RawSource((0, devkit_1.serializeJson)(packageJson)));
                const packageManager = (0, devkit_1.detectPackageManager)(this.options.root);
                if (packageManager === 'bun') {
                    compilation
                        .getLogger('GeneratePackageJsonPlugin')
                        .warn('Bun lockfile generation is not supported. Only package.json will be generated.');
                }
                else {
                    compilation.emitAsset((0, js_1.getLockFileName)(packageManager), new webpack_1.sources.RawSource((0, js_1.createLockFile)(packageJson, this.options.projectGraph, packageManager)));
                }
            });
        });
    }
}
exports.GeneratePackageJsonPlugin = GeneratePackageJsonPlugin;
