"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const btoa_1 = __importDefault(require("btoa"));
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const cli_1 = require("@module-federation/data-prefetch/cli");
const FederationRuntimeModule_1 = __importDefault(require("./FederationRuntimeModule"));
const utils_1 = require("./utils");
const constant_1 = require("../constant");
const EmbedFederationRuntimePlugin_1 = __importDefault(require("./EmbedFederationRuntimePlugin"));
const FederationModulesPlugin_1 = __importDefault(require("./FederationModulesPlugin"));
const HoistContainerReferencesPlugin_1 = __importDefault(require("../HoistContainerReferencesPlugin"));
const FederationRuntimeDependency_1 = __importDefault(require("./FederationRuntimeDependency"));
const ModuleDependency = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/dependencies/ModuleDependency'));
const { RuntimeGlobals, Template } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
const { mkdirpSync } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/fs'));
const RuntimeToolsPath = require.resolve('@module-federation/runtime-tools/dist/index.esm.js');
const BundlerRuntimePath = require.resolve('@module-federation/webpack-bundler-runtime/dist/index.esm.js', {
    paths: [RuntimeToolsPath],
});
const RuntimePath = require.resolve('@module-federation/runtime/dist/index.esm.js', {
    paths: [RuntimeToolsPath],
});
const federationGlobal = (0, utils_1.getFederationGlobalScope)(RuntimeGlobals);
const onceForCompiler = new WeakSet();
const onceForCompilerEntryMap = new WeakMap();
class FederationRuntimePlugin {
    constructor(options) {
        this.options = options ? { ...options } : undefined;
        this.entryFilePath = '';
        this.bundlerRuntimePath = BundlerRuntimePath;
        this.federationRuntimeDependency = undefined; // Initialize as undefined
    }
    static getTemplate(compiler, options, bundlerRuntimePath, experiments) {
        // internal runtime plugin
        const runtimePlugins = options.runtimePlugins;
        const normalizedBundlerRuntimePath = (0, utils_1.normalizeToPosixPath)(bundlerRuntimePath || BundlerRuntimePath);
        let runtimePluginTemplates = '';
        const runtimePluginCalls = [];
        if (Array.isArray(runtimePlugins)) {
            runtimePlugins.forEach((runtimePlugin, index) => {
                if (!runtimePlugin) {
                    return;
                }
                const runtimePluginName = `plugin_${index}`;
                const runtimePluginEntry = Array.isArray(runtimePlugin)
                    ? runtimePlugin[0]
                    : runtimePlugin;
                const runtimePluginPath = (0, utils_1.normalizeToPosixPath)(path_1.default.isAbsolute(runtimePluginEntry)
                    ? runtimePluginEntry
                    : path_1.default.join(process.cwd(), runtimePluginEntry));
                const paramsStr = Array.isArray(runtimePlugin) && runtimePlugin.length > 1
                    ? JSON.stringify(runtimePlugin[1])
                    : 'undefined';
                runtimePluginTemplates += `import ${runtimePluginName} from '${runtimePluginPath}';\n`;
                runtimePluginCalls.push(`${runtimePluginName} ? (${runtimePluginName}.default || ${runtimePluginName})(${paramsStr}) : false`);
            });
        }
        const embedRuntimeLines = Template.asString([
            `if(!${federationGlobal}.runtime){`,
            Template.indent([
                `var prevFederation = ${federationGlobal};`,
                `${federationGlobal} = {}`,
                `for(var key in federation){`,
                Template.indent([`${federationGlobal}[key] = federation[key];`]),
                '}',
                `for(var key in prevFederation){`,
                Template.indent([`${federationGlobal}[key] = prevFederation[key];`]),
                '}',
            ]),
            '}',
        ]);
        return Template.asString([
            `import federation from '${normalizedBundlerRuntimePath}';`,
            runtimePluginTemplates,
            embedRuntimeLines,
            `if(!${federationGlobal}.instance){`,
            Template.indent([
                runtimePluginCalls.length
                    ? Template.asString([
                        `var pluginsToAdd = [`,
                        Template.indent(Template.indent(runtimePluginCalls.map((call) => `${call},`))),
                        `].filter(Boolean);`,
                        `${federationGlobal}.initOptions.plugins = ${federationGlobal}.initOptions.plugins ? `,
                        `${federationGlobal}.initOptions.plugins.concat(pluginsToAdd) : pluginsToAdd;`,
                    ])
                    : '',
                `${federationGlobal}.instance = ${federationGlobal}.runtime.init(${federationGlobal}.initOptions);`,
                `if(${federationGlobal}.attachShareScopeMap){`,
                Template.indent([
                    `${federationGlobal}.attachShareScopeMap(${RuntimeGlobals.require})`,
                ]),
                '}',
                `if(${federationGlobal}.installInitialConsumes){`,
                Template.indent([`${federationGlobal}.installInitialConsumes()`]),
                '}',
            ]),
            cli_1.PrefetchPlugin.addRuntime(compiler, {
                name: options.name,
            }),
            '}',
        ]);
    }
    getFilePath(compiler) {
        if (!this.options) {
            return '';
        }
        const existedFilePath = onceForCompilerEntryMap.get(compiler);
        if (existedFilePath) {
            return existedFilePath;
        }
        let entryFilePath = '';
        if (!this.options?.virtualRuntimeEntry) {
            const containerName = this.options.name;
            const hash = (0, utils_1.createHash)(`${containerName} ${FederationRuntimePlugin.getTemplate(compiler, this.options, this.bundlerRuntimePath, this.options.experiments)}`);
            entryFilePath = path_1.default.join(constant_1.TEMP_DIR, `entry.${hash}.js`);
        }
        else {
            entryFilePath = `data:text/javascript;charset=utf-8;base64,${(0, btoa_1.default)(FederationRuntimePlugin.getTemplate(compiler, this.options, this.bundlerRuntimePath, this.options.experiments))}`;
        }
        onceForCompilerEntryMap.set(compiler, entryFilePath);
        return entryFilePath;
    }
    ensureFile(compiler) {
        if (!this.options) {
            return;
        }
        // skip virtual entry
        if (this.options?.virtualRuntimeEntry) {
            return;
        }
        const filePath = this.entryFilePath;
        try {
            fs_1.default.readFileSync(filePath);
        }
        catch (err) {
            mkdirpSync(fs_1.default, constant_1.TEMP_DIR);
            fs_1.default.writeFileSync(filePath, FederationRuntimePlugin.getTemplate(compiler, this.options, this.bundlerRuntimePath, this.options.experiments));
        }
    }
    getDependency(compiler) {
        if (this.federationRuntimeDependency)
            return this.federationRuntimeDependency;
        this.ensureFile(compiler);
        this.federationRuntimeDependency = new FederationRuntimeDependency_1.default(this.entryFilePath);
        return this.federationRuntimeDependency;
    }
    prependEntry(compiler) {
        if (!this.options?.virtualRuntimeEntry) {
            this.ensureFile(compiler);
        }
        compiler.hooks.thisCompilation.tap(this.constructor.name, (compilation, { normalModuleFactory }) => {
            compilation.dependencyFactories.set(FederationRuntimeDependency_1.default, normalModuleFactory);
            compilation.dependencyTemplates.set(FederationRuntimeDependency_1.default, new ModuleDependency.Template());
        });
        compiler.hooks.make.tapAsync(this.constructor.name, (compilation, callback) => {
            const federationRuntimeDependency = this.getDependency(compiler);
            const hooks = FederationModulesPlugin_1.default.getCompilationHooks(compilation);
            compilation.addInclude(compiler.context, federationRuntimeDependency, { name: undefined }, (err, module) => {
                if (err) {
                    return callback(err);
                }
                hooks.addFederationRuntimeDependency.call(federationRuntimeDependency);
                callback();
            });
        });
    }
    injectRuntime(compiler) {
        if (!this.options || !this.options.name) {
            return;
        }
        const name = this.options.name;
        const initOptionsWithoutShared = (0, utils_1.normalizeRuntimeInitOptionsWithOutShared)(this.options);
        const federationGlobal = (0, utils_1.getFederationGlobalScope)(RuntimeGlobals || {});
        compiler.hooks.thisCompilation.tap(this.constructor.name, (compilation) => {
            const handler = (chunk, runtimeRequirements) => {
                if (runtimeRequirements.has(federationGlobal))
                    return;
                runtimeRequirements.add(federationGlobal);
                runtimeRequirements.add(RuntimeGlobals.interceptModuleExecution);
                runtimeRequirements.add(RuntimeGlobals.moduleCache);
                runtimeRequirements.add(RuntimeGlobals.compatGetDefaultExport);
                compilation.addRuntimeModule(chunk, new FederationRuntimeModule_1.default(runtimeRequirements, name, initOptionsWithoutShared));
            };
            compilation.hooks.additionalTreeRuntimeRequirements.tap(this.constructor.name, (chunk, runtimeRequirements) => {
                if (!chunk.hasRuntime())
                    return;
                if (runtimeRequirements.has(RuntimeGlobals.initializeSharing))
                    return;
                if (runtimeRequirements.has(RuntimeGlobals.currentRemoteGetScope))
                    return;
                if (runtimeRequirements.has(RuntimeGlobals.shareScopeMap))
                    return;
                if (runtimeRequirements.has(federationGlobal))
                    return;
                handler(chunk, runtimeRequirements);
            });
            // if federation runtime requirements exist
            // attach runtime module to the chunk
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.initializeSharing)
                .tap(this.constructor.name, handler);
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.currentRemoteGetScope)
                .tap(this.constructor.name, handler);
            compilation.hooks.runtimeRequirementInTree
                .for(RuntimeGlobals.shareScopeMap)
                .tap(this.constructor.name, handler);
            compilation.hooks.runtimeRequirementInTree
                .for(federationGlobal)
                .tap(this.constructor.name, handler);
        });
    }
    getRuntimeAlias(compiler) {
        const { implementation } = this.options || {};
        let runtimePath = RuntimePath;
        const alias = compiler.options.resolve.alias || {};
        if (alias['@module-federation/runtime$']) {
            runtimePath = alias['@module-federation/runtime$'];
        }
        else {
            if (implementation) {
                runtimePath = require.resolve(`@module-federation/runtime/dist/index.esm.js`, {
                    paths: [implementation],
                });
            }
        }
        return runtimePath;
    }
    setRuntimeAlias(compiler) {
        const { implementation } = this.options || {};
        const alias = compiler.options.resolve.alias || {};
        const runtimePath = this.getRuntimeAlias(compiler);
        alias['@module-federation/runtime$'] =
            alias['@module-federation/runtime$'] || runtimePath;
        alias['@module-federation/runtime-tools$'] =
            alias['@module-federation/runtime-tools$'] ||
                implementation ||
                RuntimeToolsPath;
        // Set up aliases for the federation runtime and tools
        // This ensures that the correct versions are used throughout the project
        compiler.options.resolve.alias = alias;
    }
    apply(compiler) {
        const useModuleFederationPlugin = compiler.options.plugins.find((p) => {
            if (typeof p !== 'object' || !p) {
                return false;
            }
            return p['name'] === 'ModuleFederationPlugin';
        });
        if (useModuleFederationPlugin && !this.options) {
            this.options = useModuleFederationPlugin._options;
        }
        const useContainerPlugin = compiler.options.plugins.find((p) => {
            if (typeof p !== 'object' || !p) {
                return false;
            }
            return p['name'] === 'ContainerPlugin';
        });
        if (useContainerPlugin && !this.options) {
            this.options = useContainerPlugin._options;
        }
        if (!useContainerPlugin && !useModuleFederationPlugin) {
            this.options = {
                remotes: {},
                ...this.options,
            };
        }
        if (this.options && !this.options?.name) {
            //! the instance may get the same one if the name is the same https://github.com/module-federation/core/blob/main/packages/runtime/src/index.ts#L18
            this.options.name =
                compiler.options.output.uniqueName || `container_${Date.now()}`;
        }
        if (this.options?.implementation) {
            this.bundlerRuntimePath = require.resolve('@module-federation/webpack-bundler-runtime/dist/index.esm.js', {
                paths: [this.options.implementation],
            });
        }
        this.entryFilePath = this.getFilePath(compiler);
        new EmbedFederationRuntimePlugin_1.default().apply(compiler);
        new HoistContainerReferencesPlugin_1.default().apply(compiler);
        // dont run multiple times on every apply()
        if (!onceForCompiler.has(compiler)) {
            this.prependEntry(compiler);
            this.injectRuntime(compiler);
            this.setRuntimeAlias(compiler);
            onceForCompiler.add(compiler);
        }
    }
}
exports.default = FederationRuntimePlugin;
//# sourceMappingURL=FederationRuntimePlugin.js.map