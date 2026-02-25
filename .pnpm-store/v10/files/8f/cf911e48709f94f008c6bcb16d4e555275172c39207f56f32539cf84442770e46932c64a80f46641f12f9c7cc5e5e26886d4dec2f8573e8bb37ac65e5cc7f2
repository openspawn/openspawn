"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInaccessibleToUnreachableTypes = void 0;
const graphql_1 = require("graphql");
const reachable_type_filter_js_1 = require("./reachable-type-filter.js");
const transform_supergraph_to_public_schema_js_1 = require("../graphql/transform-supergraph-to-public-schema.js");
const addInaccessibleToUnreachableTypes = (resolveName, compositionResult) => {
    const inaccessibleDirectiveName = resolveName("https://specs.apollo.dev/inaccessible", "@inaccessible");
    const federationTypes = new Set([
        resolveName("https://specs.apollo.dev/join", "FieldSet"),
        resolveName("https://specs.apollo.dev/join", "Graph"),
        resolveName("https://specs.apollo.dev/link", "Import"),
        resolveName("https://specs.apollo.dev/link", "Purpose"),
        resolveName("https://specs.apollo.dev/federation", "Policy"),
        resolveName("https://specs.apollo.dev/federation", "Scope"),
        resolveName("https://specs.apollo.dev/join", "DirectiveArguments"),
    ]);
    const reachableTypeNames = (0, reachable_type_filter_js_1.getReachableTypes)((0, graphql_1.parse)(compositionResult.publicSdl));
    for (const federationType of federationTypes) {
        reachableTypeNames.add(federationType);
    }
    const supergraphSDL = (0, reachable_type_filter_js_1.addDirectiveOnTypes)({
        documentNode: (0, graphql_1.parse)(compositionResult.supergraphSdl),
        excludedTypeNames: reachableTypeNames,
        directiveName: inaccessibleDirectiveName,
    });
    return {
        supergraphSdl: (0, graphql_1.print)(supergraphSDL),
        publicSdl: (0, graphql_1.print)((0, transform_supergraph_to_public_schema_js_1.transformSupergraphToPublicSchema)(supergraphSDL)),
    };
};
exports.addInaccessibleToUnreachableTypes = addInaccessibleToUnreachableTypes;
