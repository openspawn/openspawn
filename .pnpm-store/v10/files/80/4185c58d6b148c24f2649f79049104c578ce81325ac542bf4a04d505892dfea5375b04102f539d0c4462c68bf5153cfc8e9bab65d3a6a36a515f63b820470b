"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPathForAutoSchemaFile = getPathForAutoSchemaFile;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
function getPathForAutoSchemaFile(autoSchemaFile) {
    if ((0, shared_utils_1.isString)(autoSchemaFile)) {
        return autoSchemaFile;
    }
    if ((0, shared_utils_1.isObject)(autoSchemaFile) && autoSchemaFile.path) {
        return autoSchemaFile.path;
    }
    return null;
}
