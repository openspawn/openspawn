"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeSchemaContract = composeSchemaContract;
const tag_extraction_js_1 = require("./tag-extraction.js");
const compose_js_1 = require("../compose.js");
const index_js_1 = require("../utils/link/index.js");
const graphql_1 = require("graphql");
const add_inaccessible_to_unreachable_types_js_1 = require("./add-inaccessible-to-unreachable-types.js");
function composeSchemaContract(services, tagFilter, removeUnreachableTypes = true) {
    const filteredSubgraphs = (0, tag_extraction_js_1.applyTagFilterOnSubgraphs)(services, tagFilter);
    const compositionResult = (0, compose_js_1.composeServices)(filteredSubgraphs);
    if (!compositionResult.errors &&
        compositionResult.supergraphSdl &&
        removeUnreachableTypes) {
        const { resolveImportName } = (0, index_js_1.extractLinkImplementations)((0, graphql_1.parse)(compositionResult.supergraphSdl));
        return (0, add_inaccessible_to_unreachable_types_js_1.addInaccessibleToUnreachableTypes)(resolveImportName, compositionResult);
    }
    return compositionResult;
}
