import type { WebpackPluginInstance, Compiler, Compilation } from 'webpack';
export default class FederationModulesPlugin implements WebpackPluginInstance {
    name: string;
    constructor();
    static getCompilationHooks(compilation: Compilation): {
        addContainerEntryDependency: import("tapable").SyncHook<[import("../lib/container/ContainerEntryDependency").default], void>;
        addFederationRuntimeDependency: import("tapable").SyncHook<[import("../lib/container/runtime/FederationRuntimeDependency").default], void>;
        addRemoteDependency: import("tapable").SyncHook<[any], void>;
    };
    apply(compiler: Compiler): void;
}
