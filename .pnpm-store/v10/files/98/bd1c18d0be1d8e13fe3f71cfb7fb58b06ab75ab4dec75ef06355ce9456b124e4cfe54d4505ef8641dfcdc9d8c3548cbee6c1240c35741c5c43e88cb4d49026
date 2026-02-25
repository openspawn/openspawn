"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const EmbedFederationRuntimeModule_1 = __importDefault(require("./EmbedFederationRuntimeModule"));
const FederationModulesPlugin_1 = __importDefault(require("./FederationModulesPlugin"));
const utils_1 = require("./utils");
const { RuntimeGlobals } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
const PLUGIN_NAME = 'EmbedFederationRuntimePlugin';
const federationGlobal = (0, utils_1.getFederationGlobalScope)(RuntimeGlobals);
/**
 * Plugin that embeds Module Federation runtime code into chunks.
 * It ensures proper initialization of federated modules and manages runtime requirements.
 */
class EmbedFederationRuntimePlugin {
    constructor(options = {}) {
        this.processedChunks = new WeakMap();
        this.options = {
            enableForAllChunks: false,
            ...options,
        };
    }
    /**
     * Determines if runtime embedding should be enabled for a given chunk.
     */
    isEnabledForChunk(chunk) {
        // Disable for our special "build time chunk"
        if (chunk.id === 'build time chunk')
            return false;
        return this.options.enableForAllChunks || chunk.hasRuntime();
    }
    /**
     * Checks if a hook has already been tapped by this plugin.
     */
    isHookAlreadyTapped(taps, hookName) {
        return taps.some((tap) => tap.name === hookName);
    }
    apply(compiler) {
        // Prevent double application of the plugin.
        const compilationTaps = compiler.hooks.thisCompilation.taps || [];
        if (this.isHookAlreadyTapped(compilationTaps, PLUGIN_NAME)) {
            return;
        }
        // Tap into the compilation to modify renderStartup and runtime requirements.
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            // --- Part 1: Modify renderStartup to append a startup call when none is added automatically ---
            const { renderStartup } = compiler.webpack.javascript.JavascriptModulesPlugin.getCompilationHooks(compilation);
            renderStartup.tap(PLUGIN_NAME, (startupSource, _lastInlinedModule, renderContext) => {
                const { chunk, chunkGraph } = renderContext;
                if (!this.isEnabledForChunk(chunk)) {
                    return startupSource;
                }
                const runtimeRequirements = chunkGraph.getTreeRuntimeRequirements(chunk);
                const entryModuleCount = chunkGraph.getNumberOfEntryModules(chunk);
                // The default renderBootstrap automatically pushes a startup call when either:
                //   - There is at least one entry module, OR
                //   - runtimeRequirements.has(RuntimeGlobals.startupNoDefault) is true.
                if (entryModuleCount > 0 ||
                    runtimeRequirements.has(RuntimeGlobals.startupNoDefault)) {
                    return startupSource;
                }
                // Otherwise, append a startup call.
                return new compiler.webpack.sources.ConcatSource(startupSource, '\n// Custom hook: appended startup call because none was added automatically\n', `${RuntimeGlobals.startup}();\n`);
            });
            // --- Part 2: Embed Federation Runtime Module and adjust runtime requirements ---
            const federationHooks = FederationModulesPlugin_1.default.getCompilationHooks(compilation);
            const containerEntrySet = new Set();
            // Proactively add startupOnlyBefore target chunks.
            compilation.hooks.additionalChunkRuntimeRequirements.tap(PLUGIN_NAME, (chunk, runtimeRequirements) => {
                if (!this.isEnabledForChunk(chunk)) {
                    return;
                }
                runtimeRequirements.add(RuntimeGlobals.startupOnlyBefore);
            });
            // Collect federation runtime dependencies.
            federationHooks.addFederationRuntimeDependency.tap(PLUGIN_NAME, (dependency) => {
                containerEntrySet.add(dependency);
            });
            // Handle additional runtime requirements when federation is enabled.
            const handleRuntimeRequirements = (chunk, runtimeRequirements) => {
                if (!this.isEnabledForChunk(chunk)) {
                    return;
                }
                // Skip if already processed or if not a federation chunk.
                if (runtimeRequirements.has('embeddedFederationRuntime'))
                    return;
                if (!runtimeRequirements.has(federationGlobal)) {
                    return;
                }
                // Mark as embedded and add the runtime module.
                runtimeRequirements.add('embeddedFederationRuntime');
                const runtimeModule = new EmbedFederationRuntimeModule_1.default(containerEntrySet);
                compilation.addRuntimeModule(chunk, runtimeModule);
            };
            compilation.hooks.runtimeRequirementInTree
                .for(federationGlobal)
                .tap(PLUGIN_NAME, handleRuntimeRequirements);
        });
    }
}
exports.default = EmbedFederationRuntimePlugin;
//# sourceMappingURL=EmbedFederationRuntimePlugin.js.map