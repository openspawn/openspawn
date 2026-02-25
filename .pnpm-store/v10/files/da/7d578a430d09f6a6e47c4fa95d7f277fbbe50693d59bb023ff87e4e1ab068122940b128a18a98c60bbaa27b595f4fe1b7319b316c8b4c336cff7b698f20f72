"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_webpack_path_1 = require("@module-federation/sdk/normalize-webpack-path");
const makeSerializable = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack/lib/util/makeSerializable'));
const { Dependency } = require((0, normalize_webpack_path_1.normalizeWebpackPath)('webpack'));
class SharedEntryDependency extends Dependency {
    /**
     * @param {string} name entry name
     * @param {string} request the request of the entry
     */
    constructor(name, request) {
        super();
        this.name = name;
        this.request = request;
    }
    /**
     * @returns {string | null} an identifier to merge equal requests
     */
    getResourceIdentifier() {
        return `shared-entry-${this.name}`;
    }
    get type() {
        return 'shared entry';
    }
    get category() {
        return 'esm';
    }
}
makeSerializable(SharedEntryDependency, 'enhanced/lib/container/SharedEntryDependency');
exports.default = SharedEntryDependency;
//# sourceMappingURL=SharedEntryDependency.js.map