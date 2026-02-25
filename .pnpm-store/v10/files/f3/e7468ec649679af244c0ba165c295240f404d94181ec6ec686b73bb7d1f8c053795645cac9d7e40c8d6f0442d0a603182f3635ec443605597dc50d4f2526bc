"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMatchedConfigs = resolveMatchedConfigs;
/*
    MIT License http://www.opensource.org/licenses/mit-license.php
    Author Tobias Koppers @sokra, Zackary Jackson @ScriptedAlchemy
*/
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const ModuleNotFoundError = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/ModuleNotFoundError'));
const LazySet = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/LazySet'));
const RELATIVE_REQUEST_REGEX = /^\.\.?(\/|$)/;
const ABSOLUTE_PATH_REGEX = /^(\/|[A-Za-z]:\\|\\\\)/;
const RESOLVE_OPTIONS = {
    dependencyType: 'esm',
};
function createCompositeKey(request, config) {
    // disabling layer as fallback so that we can use issuerLayer to match
    // this way we can catch unlayered requests and default them to another layer
    // example react -> layered react without (layer)react
    const layer = config.issuerLayer; //|| config.layer;
    if (layer) {
        return `(${layer})${request}`;
    }
    return request;
}
async function resolveMatchedConfigs(compilation, configs) {
    const resolved = new Map();
    const unresolved = new Map();
    const prefixed = new Map();
    const resolveContext = {
        fileDependencies: new LazySet(),
        contextDependencies: new LazySet(),
        missingDependencies: new LazySet(),
    };
    const resolver = compilation.resolverFactory.get('normal', RESOLVE_OPTIONS);
    const context = compilation.compiler.context;
    await Promise.all(configs.map(([request, config]) => {
        const resolveRequest = config.request || request;
        if (RELATIVE_REQUEST_REGEX.test(resolveRequest)) {
            // relative request
            return new Promise((resolve) => {
                resolver.resolve({}, context, resolveRequest, resolveContext, (err, result) => {
                    if (err || result === false) {
                        err = err || new Error(`Can't resolve ${resolveRequest}`);
                        compilation.errors.push(new ModuleNotFoundError(null, err, {
                            name: `shared module ${resolveRequest}`,
                        }));
                        return resolve();
                    }
                    resolved.set(result, config);
                    resolve();
                });
            });
        }
        else if (ABSOLUTE_PATH_REGEX.test(resolveRequest)) {
            // absolute path
            resolved.set(resolveRequest, config);
            return undefined;
        }
        else if (resolveRequest.endsWith('/')) {
            // module request prefix
            const key = createCompositeKey(resolveRequest, config);
            prefixed.set(key, config);
            return undefined;
        }
        else {
            // module request
            const key = createCompositeKey(resolveRequest, config);
            unresolved.set(key, config);
            return undefined;
        }
    }));
    compilation.contextDependencies.addAll(resolveContext.contextDependencies);
    compilation.fileDependencies.addAll(resolveContext.fileDependencies);
    compilation.missingDependencies.addAll(resolveContext.missingDependencies);
    return { resolved, unresolved, prefixed };
}
//# sourceMappingURL=resolveMatchedConfigs.js.map