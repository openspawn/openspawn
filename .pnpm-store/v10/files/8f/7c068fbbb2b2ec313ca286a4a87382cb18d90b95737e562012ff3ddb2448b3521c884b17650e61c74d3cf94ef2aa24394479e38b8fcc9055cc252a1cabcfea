"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Extensions = Extensions;
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
/**
 * Adds arbitrary data accessible through the "extensions" property to specified field, type, or handler.
 *
 * @publicApi
 */
function Extensions(value) {
    return (target, propertyKey) => {
        lazy_metadata_storage_1.LazyMetadataStorage.store(() => {
            if (propertyKey) {
                type_metadata_storage_1.TypeMetadataStorage.addExtensionsPropertyMetadata({
                    target: target.constructor,
                    fieldName: propertyKey,
                    value,
                });
            }
            else {
                type_metadata_storage_1.TypeMetadataStorage.addExtensionsMetadata({
                    target: target,
                    value,
                });
            }
        });
    };
}
