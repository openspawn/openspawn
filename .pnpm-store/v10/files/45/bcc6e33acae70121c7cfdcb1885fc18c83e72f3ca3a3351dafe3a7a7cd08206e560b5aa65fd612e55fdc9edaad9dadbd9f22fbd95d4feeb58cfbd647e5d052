declare const dependencies: typeof import("webpack").dependencies;
declare class ConsumeSharedFallbackDependency extends dependencies.ModuleDependency {
    layer?: string | null;
    /**
     * @param {string} request the request
     * @param {string | null} layer the layer for the fallback module
     */
    constructor(request: string, layer?: string | null);
    get type(): string;
    get category(): string;
}
export default ConsumeSharedFallbackDependency;
