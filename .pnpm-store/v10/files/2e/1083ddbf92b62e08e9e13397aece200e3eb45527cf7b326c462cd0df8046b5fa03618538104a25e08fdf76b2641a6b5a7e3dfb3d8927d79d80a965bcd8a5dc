declare const Dependency: typeof import("webpack").Dependency;
declare class SharedEntryDependency extends Dependency {
    name: string;
    request: string;
    /**
     * @param {string} name entry name
     * @param {string} request the request of the entry
     */
    constructor(name: string, request: string);
    /**
     * @returns {string | null} an identifier to merge equal requests
     */
    getResourceIdentifier(): string | null;
    get type(): string;
    get category(): string;
}
export default SharedEntryDependency;
