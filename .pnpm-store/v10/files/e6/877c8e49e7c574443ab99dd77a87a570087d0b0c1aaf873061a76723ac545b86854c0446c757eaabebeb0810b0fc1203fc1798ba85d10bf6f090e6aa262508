"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const devkit_1 = require("@nx/devkit");
async function default_1(tree) {
    const projects = (0, devkit_1.getProjects)(tree);
    for (const [projectName] of projects) {
        const projectConfig = (0, devkit_1.readProjectConfiguration)(tree, projectName);
        let hasChanges = false;
        if (projectConfig.targets) {
            for (const [targetName, targetConfig] of Object.entries(projectConfig.targets)) {
                if (targetConfig.executor === '@nx/webpack:webpack' ||
                    targetConfig.executor === '@nrwl/webpack:webpack') {
                    if (targetConfig.options) {
                        if ('deleteOutputPath' in targetConfig.options) {
                            delete targetConfig.options.deleteOutputPath;
                            hasChanges = true;
                            console.log(`Removed deprecated 'deleteOutputPath' option from ${projectName}:${targetName}. Use the 'output.clean' option in Webpack configuration instead.`);
                        }
                        if ('sassImplementation' in targetConfig.options) {
                            delete targetConfig.options.sassImplementation;
                            hasChanges = true;
                            console.log(`Removed deprecated 'sassImplementation' option from ${projectName}:${targetName}. This option is no longer needed.`);
                        }
                    }
                    if (targetConfig.configurations) {
                        for (const [configName, config] of Object.entries(targetConfig.configurations)) {
                            if ('deleteOutputPath' in config) {
                                delete config.deleteOutputPath;
                                hasChanges = true;
                                console.log(`Removed deprecated 'deleteOutputPath' option from ${projectName}:${targetName}:${configName}. Use the 'output.clean' option in Webpack configuration instead.`);
                            }
                            if ('sassImplementation' in config) {
                                delete config.sassImplementation;
                                hasChanges = true;
                                console.log(`Removed deprecated 'sassImplementation' option from ${projectName}:${targetName}:${configName}. This option is no longer needed.`);
                            }
                        }
                    }
                }
            }
        }
        if (hasChanges) {
            (0, devkit_1.updateProjectConfiguration)(tree, projectName, projectConfig);
        }
    }
    await (0, devkit_1.formatFiles)(tree);
}
