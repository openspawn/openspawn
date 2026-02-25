"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const { RuntimeGlobals, RuntimeModule } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
const { getUndoPath } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/identifier'));
const tapable_1 = require("tapable");
const compileBooleanMatcher = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/compileBooleanMatcher'));
const webpackChunkUtilities_1 = require("./webpackChunkUtilities");
const sdk_1 = require("@module-federation/sdk");
const stratagies_1 = require("../filesystem/stratagies");
const createBundlerLogger = typeof sdk_1.createInfrastructureLogger === 'function'
    ? sdk_1.createInfrastructureLogger
    : sdk_1.createLogger;
class DynamicFilesystemChunkLoadingRuntimeModule extends RuntimeModule {
    constructor(runtimeRequirements, options, chunkLoadingContext) {
        super('readFile chunk loading', RuntimeModule.STAGE_ATTACH + 1);
        this.hooks = {
            strategyCase: new tapable_1.SyncWaterfallHook(['source']),
        };
        this.logger = createBundlerLogger('[ DynamicFilesystemChunkLoadingRuntimeModule ]');
        this.runtimeRequirements = runtimeRequirements;
        this.options = options;
        this.chunkLoadingContext = chunkLoadingContext;
    }
    /**
     * @private
     * @param {Chunk} chunk chunk
     * @param {string} rootOutputDir root output directory
     * @returns {string} generated code
     */
    _generateBaseUri(chunk, rootOutputDir) {
        const options = chunk.getEntryOptions();
        if (options && options.baseUri) {
            return `${RuntimeGlobals.baseURI} = ${JSON.stringify(options.baseUri)};`;
        }
        return `${RuntimeGlobals.baseURI} = require("url").pathToFileURL(${rootOutputDir
            ? `__dirname + ${JSON.stringify('/' + rootOutputDir)}`
            : '__filename'});`;
    }
    /**
     * @private
     * @param {unknown[]} items item to log
     */
    _getLogger(...items) {
        if (!this.options.debug) {
            return '';
        }
        return `console.log(${items.join(',')});`;
    }
    /**
     * @returns {string} runtime code
     */
    generate() {
        const { remotes = {}, name } = this.options;
        const { webpack } = this.chunkLoadingContext;
        const { chunkGraph, chunk, compilation } = this;
        const { Template } = webpack;
        if (!chunkGraph || !chunk || !compilation) {
            this.logger.warn('Missing required properties. Returning empty string.');
            return '';
        }
        const infrastructureLogger = compilation.getLogger?.('DynamicFilesystemChunkLoadingRuntimeModule');
        if (infrastructureLogger) {
            this.logger.setDelegate(infrastructureLogger);
        }
        const { runtimeTemplate } = compilation;
        const jsModulePlugin = webpack?.javascript?.JavascriptModulesPlugin ||
            require('webpack/lib/javascript/JavascriptModulesPlugin');
        const { chunkHasJs } = jsModulePlugin;
        const fn = RuntimeGlobals.ensureChunkHandlers;
        const conditionMap = chunkGraph.getChunkConditionMap(chunk, chunkHasJs);
        const hasJsMatcher = compileBooleanMatcher(conditionMap);
        const initialChunkIds = (0, webpackChunkUtilities_1.getInitialChunkIds)(chunk, chunkGraph, chunkHasJs);
        const outputName = compilation.getPath(jsModulePlugin.getChunkFilenameTemplate(chunk, compilation.outputOptions), { chunk, contentHashType: 'javascript' });
        const rootOutputDir = getUndoPath(outputName, compilation.outputOptions.path || '', false);
        const stateExpression = this.runtimeRequirements.has(RuntimeGlobals.hmrDownloadUpdateHandlers)
            ? `${RuntimeGlobals.hmrRuntimeStatePrefix}_readFileVm`
            : undefined;
        const dynamicFilesystemChunkLoadingPluginCode = Template.asString([
            stratagies_1.fileSystemRunInContextStrategy.toString(),
            stratagies_1.httpEvalStrategy.toString(),
            stratagies_1.httpVmStrategy.toString(),
            'const loadChunkStrategy = async (strategyType,chunkId,rootOutputDir, remotes, callback) => {',
            Template.indent([
                'switch (strategyType) {',
                Template.indent([
                    'case "filesystem": return await fileSystemRunInContextStrategy(chunkId,rootOutputDir, remotes, callback);',
                    'case "http-eval": return await httpEvalStrategy(chunkId,rootOutputDir, remotes, callback);',
                    'case "http-vm": return await httpVmStrategy(chunkId,rootOutputDir, remotes, callback);',
                    this.hooks.strategyCase.call('default: throw new Error("Invalid strategy type");'),
                ]),
                '}',
            ]),
            '};',
        ]);
        return Template.asString([
            dynamicFilesystemChunkLoadingPluginCode,
            this.runtimeRequirements.has(RuntimeGlobals.baseURI)
                ? this._generateBaseUri(chunk, rootOutputDir)
                : '// no baseURI',
            '',
            '// object to store loaded chunks',
            '// "0" means "already loaded", Promise means loading',
            `var installedChunks = ${stateExpression ? `${stateExpression} = ${stateExpression} || ` : ''}{`,
            Template.indent(Array.from(initialChunkIds, (id) => `${JSON.stringify(id)}: 0`).join(',\n')),
            '};',
            '',
            (0, webpackChunkUtilities_1.handleOnChunkLoad)(this.runtimeRequirements.has(RuntimeGlobals.onChunksLoaded), runtimeTemplate),
            '',
            (0, webpackChunkUtilities_1.generateInstallChunk)(runtimeTemplate, this.runtimeRequirements.has(RuntimeGlobals.onChunksLoaded)),
            '',
            this.runtimeRequirements.has(RuntimeGlobals.ensureChunkHandlers)
                ? (0, webpackChunkUtilities_1.generateLoadScript)(runtimeTemplate)
                : '// no remote script loader needed',
            this.runtimeRequirements.has(RuntimeGlobals.ensureChunkHandlers)
                ? (0, webpackChunkUtilities_1.generateLoadingCode)(this.runtimeRequirements.has(RuntimeGlobals.ensureChunkHandlers), fn, hasJsMatcher, rootOutputDir, remotes, name)
                : '// no chunk loading',
            '',
            (0, webpackChunkUtilities_1.generateExternalInstallChunkCode)(this.runtimeRequirements.has(RuntimeGlobals.externalInstallChunk), this.options.debug),
            '',
            (0, webpackChunkUtilities_1.generateHmrCode)(this.runtimeRequirements.has(RuntimeGlobals.hmrDownloadUpdateHandlers), rootOutputDir),
            '',
            (0, webpackChunkUtilities_1.generateHmrManifestCode)(this.runtimeRequirements.has(RuntimeGlobals.hmrDownloadManifest), rootOutputDir),
        ]);
    }
}
exports.default = DynamicFilesystemChunkLoadingRuntimeModule;
//# sourceMappingURL=DynamicFilesystemChunkLoadingRuntimeModule.js.map