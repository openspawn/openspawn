"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const SharedDependency_1 = __importDefault(require("./SharedDependency"));
const utils_1 = require("../../../container/runtime/utils");
const makeSerializable = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/makeSerializable'));
const { sources: webpackSources, Template, Module, RuntimeGlobals, } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
const StaticExportsDependency = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/dependencies/StaticExportsDependency'));
const SOURCE_TYPES = new Set(['javascript']);
class SharedEntryModule extends Module {
    /**
     * @param {string} name shared name
     * @param {string} request request
     */
    constructor(name, request) {
        super('shared-entry-module', null);
        // super(JAVASCRIPT_MODULE_TYPE_DYNAMIC, null);
        this._name = name;
        this._request = request;
    }
    /**
     * @param {ObjectDeserializerContext} context context
     * @returns {SharedEntryModule} deserialized container entry module
     */
    static deserialize(context) {
        const { read } = context;
        const obj = new SharedEntryModule(read(), read());
        obj.deserialize(context);
        return obj;
    }
    /**
     * @returns {Set<string>} types available (do not mutate)
     */
    getSourceTypes() {
        return SOURCE_TYPES;
    }
    /**
     * @returns {string} a unique identifier of the module
     */
    identifier() {
        return `shared module ${this._name} ${this._request}`;
    }
    /**
     * @param {RequestShortener} requestShortener the request shortener
     * @returns {string} a user readable identifier of the module
     */
    readableIdentifier(requestShortener) {
        return `shared module ${this._name} ${requestShortener.shorten(this._request)}`;
    }
    /**
     * @param {LibIdentOptions} options options
     * @returns {string | null} an identifier for library inclusion
     */
    libIdent(options) {
        return `shared module ${this._name}`;
    }
    /**
     * @param {NeedBuildContext} context context info
     * @param {function((WebpackError | null)=, boolean=): void} callback callback function, returns true, if the module needs a rebuild
     * @returns {void}
     */
    needBuild(context, callback) {
        callback(null, !this.buildMeta);
    }
    /**
     * @param {WebpackOptions} options webpack options
     * @param {Compilation} compilation the compilation
     * @param {ResolverWithOptions} resolver the resolver
     * @param {InputFileSystem} fs the file system
     * @param {function(WebpackError): void} callback callback function
     * @returns {void}
     */
    build(options, compilation, resolver, fs, callback) {
        this.buildMeta = {};
        this.buildInfo = {
            strict: true,
            topLevelDeclarations: new Set(['get', 'init']),
        };
        this.buildMeta.exportsType = 'namespace';
        this.clearDependenciesAndBlocks();
        this.addDependency(new StaticExportsDependency(['get', 'init'], false));
        this.addDependency(new SharedDependency_1.default(this._name, this._request));
        callback();
    }
    /**
     * @param {CodeGenerationContext} context context for code generation
     * @returns {CodeGenerationResult} result
     */
    // @ts-ignore
    codeGeneration({ 
    // @ts-ignore
    chunkGraph, 
    // @ts-ignore
    runtimeTemplate, }) {
        const sources = new Map();
        const runtimeRequirements = new Set([
            RuntimeGlobals.definePropertyGetters,
            RuntimeGlobals.hasOwnProperty,
            RuntimeGlobals.exports,
        ]);
        const moduleGetter = runtimeTemplate.syncModuleFactory({
            dependency: this.dependencies[1],
            chunkGraph,
            request: this._request,
            runtimeRequirements,
        });
        const source = Template.asString([
            `var moduleGetter = ${moduleGetter};`,
            `var get = ${runtimeTemplate.basicFunction('module, getScope', [
                'return moduleGetter();',
            ])};`,
            `var init = ${runtimeTemplate.basicFunction('mfInstance, bundlerRuntime', [
                `${(0, utils_1.getFederationGlobalScope)(RuntimeGlobals)}.instance = mfInstance;`,
                `${(0, utils_1.getFederationGlobalScope)(RuntimeGlobals)}.bundlerRuntime = bundlerRuntime;`,
                `if(!${(0, utils_1.getFederationGlobalScope)(RuntimeGlobals)}.installInitialConsumes) { return Promise.resolve(); }`,
                `return ${(0, utils_1.getFederationGlobalScope)(RuntimeGlobals)}.installInitialConsumes({ asyncLoad: true });`,
            ])};`,
            '// This exports getters to disallow modifications',
            `${RuntimeGlobals.definePropertyGetters}(exports, {`,
            Template.indent([
                `get: ${runtimeTemplate.returningFunction('get')},`,
                `init: ${runtimeTemplate.returningFunction('init')}`,
            ]),
            '});',
        ]);
        sources.set('javascript', this.useSourceMap || this.useSimpleSourceMap
            ? new webpackSources.OriginalSource(source, 'webpack/shared-entry')
            : new webpackSources.RawSource(source));
        return {
            sources,
            runtimeRequirements,
        };
    }
    /**
     * @param {string=} type the source type for which the size should be estimated
     * @returns {number} the estimated size of the module (must be non-zero)
     */
    size(type) {
        return 42;
    }
    /**
     * @param {ObjectSerializerContext} context context
     */
    serialize(context) {
        const { write } = context;
        write(this._name);
        write(this._request);
        super.serialize(context);
    }
}
makeSerializable(SharedEntryModule, 'SharedEntryModule');
exports.default = SharedEntryModule;
//# sourceMappingURL=SharedEntryModule.js.map