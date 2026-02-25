"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReferencedModules = getAllReferencedModules;
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const FederationModulesPlugin_1 = __importDefault(require("./runtime/FederationModulesPlugin"));
const { AsyncDependenciesBlock, ExternalModule } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
const PLUGIN_NAME = 'HoistContainerReferences';
/**
 * This plugin hoists container-related modules into runtime chunks when using runtimeChunk: single configuration.
 */
class HoistContainerReferences {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            const logger = compilation.getLogger(PLUGIN_NAME);
            const hooks = FederationModulesPlugin_1.default.getCompilationHooks(compilation);
            const containerEntryDependencies = new Set();
            const federationRuntimeDependencies = new Set();
            const remoteDependencies = new Set();
            hooks.addContainerEntryDependency.tap('HoistContainerReferences', (dep) => {
                containerEntryDependencies.add(dep);
            });
            hooks.addFederationRuntimeDependency.tap('HoistContainerReferences', (dep) => {
                federationRuntimeDependencies.add(dep);
            });
            hooks.addRemoteDependency.tap('HoistContainerReferences', (dep) => {
                remoteDependencies.add(dep);
            });
            // Hook into the optimizeChunks phase
            compilation.hooks.optimizeChunks.tap({
                name: PLUGIN_NAME,
                // advanced stage is where SplitChunksPlugin runs.
                stage: 11, // advanced + 1
            }, (chunks) => {
                const runtimeChunks = this.getRuntimeChunks(compilation);
                this.hoistModulesInChunks(compilation, runtimeChunks, logger, containerEntryDependencies, federationRuntimeDependencies, remoteDependencies);
            });
        });
    }
    // Method to hoist modules in chunks
    hoistModulesInChunks(compilation, runtimeChunks, logger, containerEntryDependencies, federationRuntimeDependencies, remoteDependencies) {
        const { chunkGraph, moduleGraph } = compilation;
        const allModulesToHoist = new Set();
        // Process container entry dependencies (needed for nextjs-mf exposed modules)
        for (const dep of containerEntryDependencies) {
            const containerEntryModule = moduleGraph.getModule(dep);
            if (!containerEntryModule)
                continue;
            const referencedModules = getAllReferencedModules(compilation, containerEntryModule, 'initial');
            referencedModules.forEach((m) => allModulesToHoist.add(m));
            const moduleRuntimes = chunkGraph.getModuleRuntimes(containerEntryModule);
            const runtimes = new Set();
            for (const runtimeSpec of moduleRuntimes) {
                compilation.compiler.webpack.util.runtime.forEachRuntime(runtimeSpec, (runtimeKey) => {
                    if (runtimeKey) {
                        runtimes.add(runtimeKey);
                    }
                });
            }
            for (const runtime of runtimes) {
                const runtimeChunk = compilation.namedChunks.get(runtime);
                if (!runtimeChunk)
                    continue;
                for (const module of referencedModules) {
                    if (!chunkGraph.isModuleInChunk(module, runtimeChunk)) {
                        chunkGraph.connectChunkAndModule(runtimeChunk, module);
                    }
                }
            }
        }
        // Federation Runtime Dependencies: use 'initial' (not 'all')
        for (const dep of federationRuntimeDependencies) {
            const runtimeModule = moduleGraph.getModule(dep);
            if (!runtimeModule)
                continue;
            const referencedModules = getAllReferencedModules(compilation, runtimeModule, 'initial');
            referencedModules.forEach((m) => allModulesToHoist.add(m));
            const moduleRuntimes = chunkGraph.getModuleRuntimes(runtimeModule);
            const runtimes = new Set();
            for (const runtimeSpec of moduleRuntimes) {
                compilation.compiler.webpack.util.runtime.forEachRuntime(runtimeSpec, (runtimeKey) => {
                    if (runtimeKey) {
                        runtimes.add(runtimeKey);
                    }
                });
            }
            for (const runtime of runtimes) {
                const runtimeChunk = compilation.namedChunks.get(runtime);
                if (!runtimeChunk)
                    continue;
                for (const module of referencedModules) {
                    if (!chunkGraph.isModuleInChunk(module, runtimeChunk)) {
                        chunkGraph.connectChunkAndModule(runtimeChunk, module);
                    }
                }
            }
        }
        // Process remote dependencies
        for (const remoteDep of remoteDependencies) {
            const remoteModule = moduleGraph.getModule(remoteDep);
            if (!remoteModule)
                continue;
            const referencedRemoteModules = getAllReferencedModules(compilation, remoteModule, 'initial');
            referencedRemoteModules.forEach((m) => allModulesToHoist.add(m));
            const remoteModuleRuntimes = chunkGraph.getModuleRuntimes(remoteModule);
            const remoteRuntimes = new Set();
            for (const runtimeSpec of remoteModuleRuntimes) {
                compilation.compiler.webpack.util.runtime.forEachRuntime(runtimeSpec, (runtimeKey) => {
                    if (runtimeKey)
                        remoteRuntimes.add(runtimeKey);
                });
            }
            for (const runtime of remoteRuntimes) {
                const runtimeChunk = compilation.namedChunks.get(runtime);
                if (!runtimeChunk)
                    continue;
                for (const module of referencedRemoteModules) {
                    if (!chunkGraph.isModuleInChunk(module, runtimeChunk)) {
                        chunkGraph.connectChunkAndModule(runtimeChunk, module);
                    }
                }
            }
        }
        this.cleanUpChunks(compilation, allModulesToHoist);
    }
    // Method to clean up chunks by disconnecting unused modules
    cleanUpChunks(compilation, modules) {
        const { chunkGraph } = compilation;
        for (const module of modules) {
            for (const chunk of chunkGraph.getModuleChunks(module)) {
                if (!chunk.hasRuntime()) {
                    chunkGraph.disconnectChunkAndModule(chunk, module);
                }
            }
        }
    }
    // Method to get runtime chunks
    getRuntimeChunks(compilation) {
        const runtimeChunks = new Set();
        for (const chunk of compilation.chunks) {
            if (chunk.hasRuntime()) {
                runtimeChunks.add(chunk);
            }
        }
        return runtimeChunks;
    }
}
// Helper method to collect all referenced modules recursively
function getAllReferencedModules(compilation, module, type) {
    const collectedModules = new Set([module]);
    const visitedModules = new WeakSet([module]);
    const stack = [module];
    while (stack.length > 0) {
        const currentModule = stack.pop();
        if (!currentModule)
            continue;
        const mgm = compilation.moduleGraph._getModuleGraphModule(currentModule);
        if (!mgm?.outgoingConnections)
            continue;
        for (const connection of mgm.outgoingConnections) {
            const connectedModule = connection.module;
            // Skip if module has already been visited
            if (!connectedModule || visitedModules.has(connectedModule)) {
                continue;
            }
            // Handle 'initial' type (skipping async blocks)
            if (type === 'initial') {
                const parentBlock = compilation.moduleGraph.getParentBlock(connection.dependency);
                if (parentBlock instanceof AsyncDependenciesBlock) {
                    continue;
                }
            }
            // Handle 'external' type (collecting only external modules)
            if (type === 'external') {
                if (connection.module instanceof ExternalModule) {
                    collectedModules.add(connectedModule);
                }
            }
            else {
                // Handle 'all' or unspecified types
                collectedModules.add(connectedModule);
            }
            // Add connected module to the stack and mark it as visited
            visitedModules.add(connectedModule);
            stack.push(connectedModule);
        }
    }
    return collectedModules;
}
exports.default = HoistContainerReferences;
//# sourceMappingURL=HoistContainerReferencesPlugin.js.map