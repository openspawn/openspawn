import ContainerEntryDependency from '../ContainerEntryDependency';
import type FederationRuntimeDependency from './FederationRuntimeDependency';
declare const RuntimeModule: typeof import("webpack").RuntimeModule;
declare class EmbedFederationRuntimeModule extends RuntimeModule {
    private containerEntrySet;
    _cachedGeneratedCode: string | undefined;
    constructor(containerEntrySet: Set<ContainerEntryDependency | FederationRuntimeDependency>);
    identifier(): string;
    generate(): string | null;
}
export default EmbedFederationRuntimeModule;
