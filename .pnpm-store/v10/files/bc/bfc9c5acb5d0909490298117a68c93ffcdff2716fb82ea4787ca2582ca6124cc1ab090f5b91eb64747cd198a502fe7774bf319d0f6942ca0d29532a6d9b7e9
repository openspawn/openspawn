import type { Compilation } from 'webpack';
import BaseWrapperPlugin from './BaseWrapperPlugin';
export default class FederationModulesPlugin extends BaseWrapperPlugin {
    constructor();
    static getCompilationHooks(compilation: Compilation): {
        addContainerEntryDependency: import("tapable").SyncHook<[import("../lib/container/ContainerEntryDependency").default], void>;
        addFederationRuntimeDependency: import("tapable").SyncHook<[import("../lib/container/runtime/FederationRuntimeDependency").default], void>;
        addRemoteDependency: import("tapable").SyncHook<[any], void>;
    };
    protected createCorePluginInstance(CorePlugin: any, compiler: any): void;
}
