"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTsConfig = updateTsConfig;
const devkit_1 = require("@nx/devkit");
const ts_solution_setup_1 = require("@nx/js/src/utils/typescript/ts-solution-setup");
function updateTsConfig(tree, options) {
    (0, devkit_1.updateJson)(tree, (0, devkit_1.joinPathFragments)(options.appProjectRoot, 'tsconfig.app.json'), (json) => {
        json.compilerOptions.experimentalDecorators = true;
        json.compilerOptions.emitDecoratorMetadata = true;
        json.compilerOptions.target = 'es2021';
        // Only set this when not using TS solution setup, as TS solution setup uses 'nodenext'
        if (!(0, ts_solution_setup_1.isUsingTsSolutionSetup)(tree)) {
            json.compilerOptions.moduleResolution = 'node';
        }
        if (options.strict) {
            json.compilerOptions = {
                ...json.compilerOptions,
                strictNullChecks: true,
                noImplicitAny: true,
                strictBindCallApply: true,
                forceConsistentCasingInFileNames: true,
                noFallthroughCasesInSwitch: true,
            };
        }
        return json;
    });
    // For TS solution, we don't extend from shared tsconfig.json, so we need to make sure decorators are also turned on for spec tsconfig.
    if ((0, ts_solution_setup_1.isUsingTsSolutionSetup)(tree)) {
        const tsconfigSpecPath = (0, devkit_1.joinPathFragments)(options.appProjectRoot, 'tsconfig.spec.json');
        if (tree.exists(tsconfigSpecPath)) {
            (0, devkit_1.updateJson)(tree, tsconfigSpecPath, (json) => {
                json.compilerOptions ??= {};
                json.compilerOptions.experimentalDecorators = true;
                json.compilerOptions.emitDecoratorMetadata = true;
                return json;
            });
        }
    }
}
