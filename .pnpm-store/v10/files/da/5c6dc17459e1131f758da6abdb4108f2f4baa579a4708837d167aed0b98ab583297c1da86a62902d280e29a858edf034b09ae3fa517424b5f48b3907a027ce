"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const makeSerializable = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/makeSerializable'));
const { dependencies } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
class SharedDependency extends dependencies.ModuleDependency {
    /**
     * @param {string} sharedName public name
     * @param {string} request request to module
     */
    constructor(sharedName, request) {
        super(request);
        this.sharedName = sharedName;
        this.request = request;
    }
    get type() {
        return 'shared exposed';
    }
    get category() {
        return 'esm';
    }
    /**
     * @returns {string | null} an identifier to merge equal requests
     */
    getResourceIdentifier() {
        return `shared dependency ${this.sharedName}=${this.request}`;
    }
    /**
     * @param {ObjectSerializerContext} context context
     */
    serialize(context) {
        context.write(this.sharedName);
        super.serialize(context);
    }
    /**
     * @param {ObjectDeserializerContext} context context
     */
    deserialize(context) {
        this.sharedName = context.read();
        super.deserialize(context);
    }
}
makeSerializable(SharedDependency, 'SharedDependency');
exports.default = SharedDependency;
//# sourceMappingURL=SharedDependency.js.map