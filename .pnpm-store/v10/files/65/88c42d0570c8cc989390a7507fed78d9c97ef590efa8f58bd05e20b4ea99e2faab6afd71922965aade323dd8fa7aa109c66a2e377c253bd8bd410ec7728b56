import { applyTagFilterOnSubgraphs, } from "./tag-extraction.js";
import { composeServices } from "../compose.js";
import { extractLinkImplementations } from "../utils/link/index.js";
import { parse } from "graphql";
import { addInaccessibleToUnreachableTypes } from "./add-inaccessible-to-unreachable-types.js";
export function composeSchemaContract(services, tagFilter, removeUnreachableTypes = true) {
    const filteredSubgraphs = applyTagFilterOnSubgraphs(services, tagFilter);
    const compositionResult = composeServices(filteredSubgraphs);
    if (!compositionResult.errors &&
        compositionResult.supergraphSdl &&
        removeUnreachableTypes) {
        const { resolveImportName } = extractLinkImplementations(parse(compositionResult.supergraphSdl));
        return addInaccessibleToUnreachableTypes(resolveImportName, compositionResult);
    }
    return compositionResult;
}
