"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.libraryGenerator = libraryGenerator;
exports.libraryGeneratorInternal = libraryGeneratorInternal;
const devkit_1 = require("@nx/devkit");
const log_show_project_command_1 = require("@nx/devkit/src/utils/log-show-project-command");
const js_1 = require("@nx/js");
const ensure_dependencies_1 = require("../../utils/ensure-dependencies");
const init_1 = require("../init/init");
const lib_1 = require("./lib");
async function libraryGenerator(tree, rawOptions) {
    return await libraryGeneratorInternal(tree, {
        addPlugin: false,
        useProjectJson: true,
        ...rawOptions,
    });
}
async function libraryGeneratorInternal(tree, rawOptions) {
    const options = await (0, lib_1.normalizeOptions)(tree, rawOptions);
    const jsLibraryTask = await (0, js_1.libraryGenerator)(tree, (0, lib_1.toJsLibraryGeneratorOptions)(options));
    updatePackageJson(tree, options);
    const initTask = await (0, init_1.default)(tree, rawOptions);
    const depsTask = (0, ensure_dependencies_1.ensureDependencies)(tree);
    (0, lib_1.deleteFiles)(tree, options);
    (0, lib_1.createFiles)(tree, options);
    (0, lib_1.addExportsToBarrelFile)(tree, options);
    (0, lib_1.updateTsConfig)(tree, options);
    (0, lib_1.addProject)(tree, options);
    if (!options.skipFormat) {
        await (0, devkit_1.formatFiles)(tree);
    }
    return (0, devkit_1.runTasksInSerial)(...[
        jsLibraryTask,
        initTask,
        depsTask,
        () => {
            (0, log_show_project_command_1.logShowProjectCommand)(options.projectName);
        },
    ]);
}
exports.default = libraryGenerator;
function updatePackageJson(tree, options) {
    const packageJsonPath = (0, devkit_1.joinPathFragments)(options.projectRoot, 'package.json');
    if (!tree.exists(packageJsonPath)) {
        return;
    }
    const packageJson = (0, devkit_1.readJson)(tree, packageJsonPath);
    if (packageJson.type === 'module') {
        // The @nx/js:lib generator can set the type to 'module' which would
        // potentially break consumers of the library.
        delete packageJson.type;
    }
    (0, devkit_1.writeJson)(tree, packageJsonPath, packageJson);
}
