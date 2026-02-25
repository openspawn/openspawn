"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueTypeNamesRule = UniqueTypeNamesRule;
const graphql_1 = require("graphql");
function UniqueTypeNamesRule(context) {
    const knownTypeNames = new Set();
    return {
        ScalarTypeDefinition: checkTypeName,
        ObjectTypeDefinition: checkTypeName,
        InterfaceTypeDefinition: checkTypeName,
        UnionTypeDefinition: checkTypeName,
        EnumTypeDefinition: checkTypeName,
        InputObjectTypeDefinition: checkTypeName,
    };
    function checkTypeName(node) {
        const typeName = node.name.value;
        if (knownTypeNames.has(typeName)) {
            context.reportError(new graphql_1.GraphQLError(`There can be only one type named "${typeName}".`, {
                extensions: {
                    code: "INVALID_GRAPHQL",
                },
            }));
        }
        else {
            knownTypeNames.add(typeName);
        }
    }
}
