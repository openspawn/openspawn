import type { Compiler, Compilation as CompilationType } from 'webpack';
import { SyncHook } from 'tapable';
import ContainerEntryDependency from '../ContainerEntryDependency';
import FederationRuntimeDependency from './FederationRuntimeDependency';
/** @typedef {{ header: string[], beforeStartup: string[], startup: string[], afterStartup: string[], allowInlineStartup: boolean }} Bootstrap */
type CompilationHooks = {
    addContainerEntryDependency: SyncHook<[ContainerEntryDependency], void>;
    addFederationRuntimeDependency: SyncHook<[FederationRuntimeDependency], void>;
    addRemoteDependency: SyncHook<[any], void>;
};
declare class FederationModulesPlugin {
    options: any;
    /**
     * @param {Compilation} compilation the compilation
     * @returns {CompilationHooks} the attached hooks
     */
    static getCompilationHooks(compilation: CompilationType): CompilationHooks;
    constructor(options?: {});
    apply(compiler: Compiler): void;
}
export default FederationModulesPlugin;
