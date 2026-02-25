/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra, Zackary Jackson @ScriptedAlchemy
*/
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Hoisted regex constants
const DIRECT_FALLBACK_REGEX = /^(\.\.?(\/|$)|\/|[A-Za-z]:|\\\\)/;
const ABSOLUTE_PATH_REGEX = /^(\/|[A-Za-z]:|\\\\)/;
const RELATIVE_OR_ABSOLUTE_PATH_REGEX = /^(?:\.{1,2}[\\/]|\/|[A-Za-z]:|\\\\)/;
const PACKAGE_NAME_REGEX = /^((?:@[^\\/]+[\\/])?[^\\/]+)/;
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const sdk_1 = require("@module-federation/sdk");
const options_1 = require("../container/options");
const resolveMatchedConfigs_1 = require("./resolveMatchedConfigs");
const utils_1 = require("./utils");
const ConsumeSharedFallbackDependency_1 = __importDefault(require("./ConsumeSharedFallbackDependency"));
const ConsumeSharedModule_1 = __importDefault(require("./ConsumeSharedModule"));
const ConsumeSharedRuntimeModule_1 = __importDefault(require("./ConsumeSharedRuntimeModule"));
const ProvideForSharedDependency_1 = __importDefault(require("./ProvideForSharedDependency"));
const FederationRuntimePlugin_1 = __importDefault(require("../container/runtime/FederationRuntimePlugin"));
const ShareRuntimeModule_1 = __importDefault(require("./ShareRuntimeModule"));
const utils_2 = require("../../utils");
const path_1 = __importDefault(require("path"));
const { satisfy, parseRange } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/semver'));
const utils_3 = require("./utils");
const ModuleNotFoundError = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/ModuleNotFoundError'));
const { RuntimeGlobals } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
const LazySet = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/LazySet'));
const WebpackError = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/WebpackError'));
const validate = (0, utils_2.createSchemaValidation)(
// eslint-disable-next-line
require('../../schemas/sharing/ConsumeSharedPlugin.check.js').validate, () => require('../../schemas/sharing/ConsumeSharedPlugin').default, {
    name: 'Consume Shared Plugin',
    baseDataPath: 'options',
});
const RESOLVE_OPTIONS = {
    dependencyType: 'esm',
};
const PLUGIN_NAME = 'ConsumeSharedPlugin';
class ConsumeSharedPlugin {
    constructor(options) {
        if (typeof options !== 'string') {
            validate(options);
        }
        this._consumes = (0, options_1.parseOptions)(options.consumes, (item, key) => {
            if (Array.isArray(item))
                throw new Error('Unexpected array in options');
            //@ts-ignore
            const result = item === key || !(0, sdk_1.isRequiredVersion)(item)
                ? // item is a request/key
                    {
                        import: key,
                        shareScope: options.shareScope || 'default',
                        shareKey: key,
                        requiredVersion: undefined,
                        packageName: undefined,
                        strictVersion: false,
                        singleton: false,
                        eager: false,
                        issuerLayer: undefined,
                        layer: undefined,
                        request: key,
                        include: undefined,
                        exclude: undefined,
                        allowNodeModulesSuffixMatch: undefined,
                    }
                : // key is a request/key
                    // item is a version
                    {
                        import: key,
                        shareScope: options.shareScope || 'default',
                        shareKey: key,
                        // webpack internal semver has some issue, use runtime semver , related issue: https://github.com/webpack/webpack/issues/17756
                        requiredVersion: item,
                        strictVersion: true,
                        packageName: undefined,
                        singleton: false,
                        eager: false,
                        issuerLayer: undefined,
                        layer: undefined,
                        request: key,
                        include: undefined,
                        exclude: undefined,
                        allowNodeModulesSuffixMatch: undefined,
                    };
            return result;
        }, (item, key) => {
            const request = item.request || key;
            return {
                import: item.import === false ? undefined : item.import || request,
                shareScope: item.shareScope || options.shareScope || 'default',
                shareKey: item.shareKey || request,
                requiredVersion: item.requiredVersion === false
                    ? false
                    : // @ts-ignore  webpack internal semver has some issue, use runtime semver , related issue: https://github.com/webpack/webpack/issues/17756
                        item.requiredVersion,
                strictVersion: typeof item.strictVersion === 'boolean'
                    ? item.strictVersion
                    : item.import !== false && !item.singleton,
                packageName: item.packageName,
                singleton: !!item.singleton,
                eager: !!item.eager,
                exclude: item.exclude,
                include: item.include,
                issuerLayer: item.issuerLayer ? item.issuerLayer : undefined,
                layer: item.layer ? item.layer : undefined,
                request,
                allowNodeModulesSuffixMatch: item.allowNodeModulesSuffixMatch,
            };
        });
    }
    createConsumeSharedModule(compilation, context, request, config) {
        const requiredVersionWarning = (details) => {
            const error = new WebpackError(`No required version specified and unable to automatically determine one. ${details}`);
            error.file = `shared module ${request}`;
            compilation.warnings.push(error);
        };
        const directFallback = config.import && DIRECT_FALLBACK_REGEX.test(config.import);
        const resolver = compilation.resolverFactory.get('normal', RESOLVE_OPTIONS);
        return Promise.all([
            new Promise((resolve) => {
                if (!config.import)
                    return resolve(undefined);
                const resolveContext = {
                    fileDependencies: new LazySet(),
                    contextDependencies: new LazySet(),
                    missingDependencies: new LazySet(),
                };
                resolver.resolve({}, directFallback ? compilation.compiler.context : context, config.import, resolveContext, (err, result) => {
                    compilation.contextDependencies.addAll(resolveContext.contextDependencies);
                    compilation.fileDependencies.addAll(resolveContext.fileDependencies);
                    compilation.missingDependencies.addAll(resolveContext.missingDependencies);
                    if (err) {
                        compilation.errors.push(new ModuleNotFoundError(null, err, {
                            name: `resolving fallback for shared module ${request}`,
                        }));
                        return resolve(undefined);
                    }
                    //@ts-ignore
                    resolve(result);
                });
            }),
            new Promise((resolve) => {
                if (config.requiredVersion !== undefined) {
                    return resolve(config.requiredVersion);
                }
                let packageName = config.packageName;
                if (packageName === undefined) {
                    if (ABSOLUTE_PATH_REGEX.test(request)) {
                        // For relative or absolute requests we don't automatically use a packageName.
                        // If wished one can specify one with the packageName option.
                        return resolve(undefined);
                    }
                    const match = PACKAGE_NAME_REGEX.exec(request);
                    if (!match) {
                        requiredVersionWarning('Unable to extract the package name from request.');
                        return resolve(undefined);
                    }
                    packageName = match[0];
                }
                (0, utils_1.getDescriptionFile)(compilation.inputFileSystem, context, ['package.json'], (err, result, checkedDescriptionFilePaths) => {
                    if (err) {
                        requiredVersionWarning(`Unable to read description file: ${err}`);
                        return resolve(undefined);
                    }
                    const { data } = /** @type {DescriptionFile} */ result || {};
                    if (!data) {
                        if (checkedDescriptionFilePaths?.length) {
                            requiredVersionWarning([
                                `Unable to find required version for "${packageName}" in description file/s`,
                                checkedDescriptionFilePaths.join('\n'),
                                'It need to be in dependencies, devDependencies or peerDependencies.',
                            ].join('\n'));
                        }
                        else {
                            requiredVersionWarning(`Unable to find description file in ${context}.`);
                        }
                        return resolve(undefined);
                    }
                    if (data['name'] === packageName) {
                        // Package self-referencing
                        return resolve(undefined);
                    }
                    const requiredVersion = (0, utils_1.getRequiredVersionFromDescriptionFile)(data, packageName);
                    //TODO: align with webpck semver parser again
                    // @ts-ignore  webpack internal semver has some issue, use runtime semver , related issue: https://github.com/webpack/webpack/issues/17756
                    resolve(requiredVersion);
                }, (result) => {
                    if (!result)
                        return false;
                    const { data } = result;
                    const maybeRequiredVersion = (0, utils_1.getRequiredVersionFromDescriptionFile)(data, packageName);
                    return (data['name'] === packageName ||
                        typeof maybeRequiredVersion === 'string');
                });
            }),
        ]).then(([importResolved, requiredVersion]) => {
            const currentConfig = {
                ...config,
                importResolved,
                import: importResolved ? config.import : undefined,
                requiredVersion,
            };
            const consumedModule = new ConsumeSharedModule_1.default(directFallback ? compilation.compiler.context : context, currentConfig);
            // Check for include version first
            if (config.include && typeof config.include.version === 'string') {
                if (!importResolved) {
                    return consumedModule;
                }
                return new Promise((resolveFilter) => {
                    (0, utils_1.getDescriptionFile)(compilation.inputFileSystem, path_1.default.dirname(importResolved), ['package.json'], (err, result) => {
                        if (err) {
                            return resolveFilter(consumedModule);
                        }
                        const { data } = result || {};
                        if (!data || !data['version'] || data['name'] !== request) {
                            return resolveFilter(consumedModule);
                        }
                        // Only include if version satisfies the include constraint
                        if (config.include &&
                            satisfy(parseRange(config.include.version), data['version'])) {
                            // Validate singleton usage with include.version
                            if (config.include &&
                                config.include.version &&
                                config.singleton) {
                                (0, utils_3.addSingletonFilterWarning)(compilation, config.shareKey || request, 'include', 'version', config.include.version, request, // moduleRequest
                                importResolved);
                            }
                            return resolveFilter(consumedModule);
                        }
                        // Check fallback version
                        if (config.include &&
                            typeof config.include.fallbackVersion === 'string' &&
                            config.include.fallbackVersion) {
                            if (satisfy(parseRange(config.include.version), config.include.fallbackVersion)) {
                                return resolveFilter(consumedModule);
                            }
                            return resolveFilter(undefined);
                        }
                        return resolveFilter(undefined);
                    });
                });
            }
            // Check for exclude version (existing logic)
            if (config.exclude && typeof config.exclude.version === 'string') {
                if (!importResolved) {
                    return consumedModule;
                }
                if (config.exclude &&
                    typeof config.exclude.fallbackVersion === 'string' &&
                    config.exclude.fallbackVersion) {
                    if (satisfy(parseRange(config.exclude.version), config.exclude.fallbackVersion)) {
                        return undefined;
                    }
                    return consumedModule;
                }
                return new Promise((resolveFilter) => {
                    (0, utils_1.getDescriptionFile)(compilation.inputFileSystem, path_1.default.dirname(importResolved), ['package.json'], (err, result) => {
                        if (err) {
                            return resolveFilter(consumedModule);
                        }
                        const { data } = result || {};
                        if (!data || !data['version'] || data['name'] !== request) {
                            return resolveFilter(consumedModule);
                        }
                        if (config.exclude &&
                            typeof config.exclude.version === 'string' &&
                            satisfy(parseRange(config.exclude.version), data['version'])) {
                            return resolveFilter(undefined);
                        }
                        // Validate singleton usage with exclude.version
                        if (config.exclude &&
                            config.exclude.version &&
                            config.singleton) {
                            (0, utils_3.addSingletonFilterWarning)(compilation, config.shareKey || request, 'exclude', 'version', config.exclude.version, request, // moduleRequest
                            importResolved);
                        }
                        return resolveFilter(consumedModule);
                    });
                });
            }
            return consumedModule;
        });
    }
    apply(compiler) {
        new FederationRuntimePlugin_1.default().apply(compiler);
        process.env['FEDERATION_WEBPACK_PATH'] =
            process.env['FEDERATION_WEBPACK_PATH'] || (0, normalize_webpack_path_1.getWebpackPath)(compiler);
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation, { normalModuleFactory }) => {
            compilation.dependencyFactories.set(ConsumeSharedFallbackDependency_1.default, normalModuleFactory);
            let unresolvedConsumes, resolvedConsumes, prefixedConsumes;
            const promise = (0, resolveMatchedConfigs_1.resolveMatchedConfigs)(compilation, this._consumes).then(({ resolved, unresolved, prefixed }) => {
                resolvedConsumes = resolved;
                unresolvedConsumes = unresolved;
                prefixedConsumes = prefixed;
            });
            normalModuleFactory.hooks.factorize.tapPromise(PLUGIN_NAME, async (resolveData) => {
                const { context, request, dependencies, contextInfo } = resolveData;
                // wait for resolving to be complete
                // BIND `this` for createConsumeSharedModule call
                const boundCreateConsumeSharedModule = this.createConsumeSharedModule.bind(this);
                return promise.then(() => {
                    if (dependencies[0] instanceof ConsumeSharedFallbackDependency_1.default ||
                        dependencies[0] instanceof ProvideForSharedDependency_1.default) {
                        return;
                    }
                    const { context, request, contextInfo } = resolveData;
                    const match = unresolvedConsumes.get((0, utils_3.createLookupKeyForSharing)(request, contextInfo.issuerLayer)) ||
                        unresolvedConsumes.get((0, utils_3.createLookupKeyForSharing)(request, undefined));
                    // First check direct match with original request
                    if (match !== undefined) {
                        // Use the bound function
                        return boundCreateConsumeSharedModule(compilation, context, request, match);
                    }
                    // Then try relative path handling and node_modules paths
                    let reconstructed = null;
                    let modulePathAfterNodeModules = null;
                    if (request &&
                        !path_1.default.isAbsolute(request) &&
                        RELATIVE_OR_ABSOLUTE_PATH_REGEX.test(request)) {
                        reconstructed = path_1.default.join(context, request);
                        modulePathAfterNodeModules =
                            (0, utils_3.extractPathAfterNodeModules)(reconstructed);
                        // Try to match with module path after node_modules
                        if (modulePathAfterNodeModules) {
                            const moduleMatch = unresolvedConsumes.get((0, utils_3.createLookupKeyForSharing)(modulePathAfterNodeModules, contextInfo.issuerLayer)) ||
                                unresolvedConsumes.get((0, utils_3.createLookupKeyForSharing)(modulePathAfterNodeModules, undefined));
                            if (moduleMatch !== undefined &&
                                moduleMatch.allowNodeModulesSuffixMatch) {
                                return boundCreateConsumeSharedModule(compilation, context, modulePathAfterNodeModules, moduleMatch);
                            }
                        }
                        // Try to match with the full reconstructed path
                        const reconstructedMatch = unresolvedConsumes.get((0, utils_3.createLookupKeyForSharing)(reconstructed, contextInfo.issuerLayer)) ||
                            unresolvedConsumes.get((0, utils_3.createLookupKeyForSharing)(reconstructed, undefined));
                        if (reconstructedMatch !== undefined) {
                            return boundCreateConsumeSharedModule(compilation, context, reconstructed, reconstructedMatch);
                        }
                    }
                    // Check for prefixed consumes with original request
                    for (const [prefix, options] of prefixedConsumes) {
                        const lookup = options.request || prefix;
                        // Refined issuerLayer matching logic
                        if (options.issuerLayer) {
                            if (!contextInfo.issuerLayer) {
                                continue; // Option is layered, request is not: skip
                            }
                            if (contextInfo.issuerLayer !== options.issuerLayer) {
                                continue; // Both are layered but do not match: skip
                            }
                        }
                        // If contextInfo.issuerLayer exists but options.issuerLayer does not, allow (non-layered option matches layered request)
                        if (request.startsWith(lookup)) {
                            const remainder = request.slice(lookup.length);
                            if (!(0, utils_3.testRequestFilters)(remainder, options.include?.request, options.exclude?.request)) {
                                continue;
                            }
                            // Use the bound function
                            return boundCreateConsumeSharedModule(compilation, context, request, {
                                ...options,
                                import: options.import
                                    ? options.import + remainder
                                    : undefined,
                                shareKey: options.shareKey + remainder,
                                layer: options.layer,
                            });
                        }
                    }
                    // Also check prefixed consumes with modulePathAfterNodeModules
                    if (modulePathAfterNodeModules) {
                        for (const [prefix, options] of prefixedConsumes) {
                            if (!options.allowNodeModulesSuffixMatch) {
                                continue;
                            }
                            // Refined issuerLayer matching logic for reconstructed path
                            if (options.issuerLayer) {
                                if (!contextInfo.issuerLayer) {
                                    continue; // Option is layered, request is not: skip
                                }
                                if (contextInfo.issuerLayer !== options.issuerLayer) {
                                    continue; // Both are layered but do not match: skip
                                }
                            }
                            // If contextInfo.issuerLayer exists but options.issuerLayer does not, allow (non-layered option matches layered request)
                            const lookup = options.request || prefix;
                            if (modulePathAfterNodeModules.startsWith(lookup)) {
                                const remainder = modulePathAfterNodeModules.slice(lookup.length);
                                if (!(0, utils_3.testRequestFilters)(remainder, options.include?.request, options.exclude?.request)) {
                                    continue;
                                }
                                return boundCreateConsumeSharedModule(compilation, context, modulePathAfterNodeModules, {
                                    ...options,
                                    import: options.import
                                        ? options.import + remainder
                                        : undefined,
                                    shareKey: options.shareKey + remainder,
                                    layer: options.layer,
                                });
                            }
                        }
                    }
                    return;
                });
            });
            normalModuleFactory.hooks.createModule.tapPromise(PLUGIN_NAME, ({ resource }, { context, dependencies }) => {
                // BIND `this` for createConsumeSharedModule call
                const boundCreateConsumeSharedModule = this.createConsumeSharedModule.bind(this);
                if (dependencies[0] instanceof ConsumeSharedFallbackDependency_1.default ||
                    dependencies[0] instanceof ProvideForSharedDependency_1.default) {
                    return Promise.resolve();
                }
                if (resource) {
                    const options = resolvedConsumes.get(resource);
                    if (options !== undefined) {
                        // Use the bound function
                        return boundCreateConsumeSharedModule(compilation, context, resource, options);
                    }
                }
                return Promise.resolve();
            });
            // Add finishModules hook to copy buildMeta/buildInfo from fallback modules *after* webpack's export analysis
            // Running earlier causes failures, so we intentionally execute later than plugins like FlagDependencyExportsPlugin.
            // This still follows webpack's pattern used by FlagDependencyExportsPlugin and InferAsyncModulesPlugin, but with a
            // later stage. Based on webpack's Compilation.js: finishModules (line 2833) runs before seal (line 2920).
            compilation.hooks.finishModules.tapAsync({
                name: PLUGIN_NAME,
                stage: 10, // Run after FlagDependencyExportsPlugin (default stage 0)
            }, (modules, callback) => {
                for (const module of modules) {
                    // Only process ConsumeSharedModule instances with fallback dependencies
                    if (!(module instanceof ConsumeSharedModule_1.default) ||
                        !module.options.import) {
                        continue;
                    }
                    let dependency;
                    if (module.options.eager) {
                        // For eager mode, get the fallback directly from dependencies
                        dependency = module.dependencies[0];
                    }
                    else {
                        // For async mode, get it from the async dependencies block
                        dependency = module.blocks[0]?.dependencies[0];
                    }
                    if (dependency) {
                        const fallbackModule = compilation.moduleGraph.getModule(dependency);
                        if (fallbackModule &&
                            fallbackModule.buildMeta &&
                            fallbackModule.buildInfo) {
                            // Copy buildMeta and buildInfo following webpack's DelegatedModule pattern: this.buildMeta = { ...delegateData.buildMeta };
                            // This ensures ConsumeSharedModule inherits ESM/CJS detection (exportsType) and other optimization metadata
                            module.buildMeta = { ...fallbackModule.buildMeta };
                            module.buildInfo = { ...fallbackModule.buildInfo };
                            // Mark all exports as provided, to avoid webpack's export analysis from marking them as unused since we copy buildMeta
                            compilation.moduleGraph
                                .getExportsInfo(module)
                                .setUnknownExportsProvided();
                        }
                    }
                }
                callback();
            });
            compilation.hooks.additionalTreeRuntimeRequirements.tap(PLUGIN_NAME, (chunk, set) => {
                set.add(RuntimeGlobals.module);
                set.add(RuntimeGlobals.moduleCache);
                set.add(RuntimeGlobals.moduleFactoriesAddOnly);
                set.add(RuntimeGlobals.shareScopeMap);
                set.add(RuntimeGlobals.initializeSharing);
                set.add(RuntimeGlobals.hasOwnProperty);
                compilation.addRuntimeModule(chunk, new ConsumeSharedRuntimeModule_1.default(set));
                // FIXME: need to remove webpack internal inject ShareRuntimeModule, otherwise there will be two ShareRuntimeModule
                compilation.addRuntimeModule(chunk, new ShareRuntimeModule_1.default());
            });
        });
    }
}
exports.default = ConsumeSharedPlugin;
//# sourceMappingURL=ConsumeSharedPlugin.js.map