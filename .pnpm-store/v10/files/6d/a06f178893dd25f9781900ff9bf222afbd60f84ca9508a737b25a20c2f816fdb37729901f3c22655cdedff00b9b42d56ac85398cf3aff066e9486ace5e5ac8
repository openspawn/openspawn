declare const dependencies: typeof import("webpack").dependencies;
import type { ObjectDeserializerContext, ObjectSerializerContext } from 'webpack/lib/dependencies/ModuleDependency';
declare class SharedDependency extends dependencies.ModuleDependency {
    sharedName: string;
    request: string;
    /**
     * @param {string} sharedName public name
     * @param {string} request request to module
     */
    constructor(sharedName: string, request: string);
    get type(): string;
    get category(): string;
    /**
     * @returns {string | null} an identifier to merge equal requests
     */
    getResourceIdentifier(): string | null;
    /**
     * @param {ObjectSerializerContext} context context
     */
    serialize(context: ObjectSerializerContext): void;
    /**
     * @param {ObjectDeserializerContext} context context
     */
    deserialize(context: ObjectDeserializerContext): void;
}
export default SharedDependency;
