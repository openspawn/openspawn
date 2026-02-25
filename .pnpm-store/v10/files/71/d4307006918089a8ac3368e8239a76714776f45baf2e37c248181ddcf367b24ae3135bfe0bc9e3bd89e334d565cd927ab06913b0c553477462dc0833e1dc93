"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDirectiveDefinition = isDirectiveDefinition;
exports.moveSchemaAndDirectiveDefinitionsToTop = moveSchemaAndDirectiveDefinitionsToTop;
const graphql_1 = require("graphql");
function isDirectiveDefinition(node) {
    return node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION;
}
const kindOrderWeightMap = {
    [graphql_1.Kind.SCHEMA_DEFINITION]: 0,
    [graphql_1.Kind.SCHEMA_EXTENSION]: 1,
    [graphql_1.Kind.DIRECTIVE_DEFINITION]: 2,
};
function moveSchemaAndDirectiveDefinitionsToTop(ast) {
    return {
        kind: graphql_1.Kind.DOCUMENT,
        definitions: ast.definitions.slice().sort((a, b) => {
            const aWeight = kindOrderWeightMap[a.kind] ?? 3;
            const bWeight = kindOrderWeightMap[b.kind] ?? 3;
            if (aWeight === bWeight) {
                return 0;
            }
            return aWeight < bWeight ? -1 : 1;
        }),
    };
}
