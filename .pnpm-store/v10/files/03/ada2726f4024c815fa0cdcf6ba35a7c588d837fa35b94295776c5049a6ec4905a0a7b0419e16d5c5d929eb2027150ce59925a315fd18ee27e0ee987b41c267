import { Kind, } from "graphql";
export function isDirectiveDefinition(node) {
    return node.kind === Kind.DIRECTIVE_DEFINITION;
}
const kindOrderWeightMap = {
    [Kind.SCHEMA_DEFINITION]: 0,
    [Kind.SCHEMA_EXTENSION]: 1,
    [Kind.DIRECTIVE_DEFINITION]: 2,
};
export function moveSchemaAndDirectiveDefinitionsToTop(ast) {
    return {
        kind: Kind.DOCUMENT,
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
