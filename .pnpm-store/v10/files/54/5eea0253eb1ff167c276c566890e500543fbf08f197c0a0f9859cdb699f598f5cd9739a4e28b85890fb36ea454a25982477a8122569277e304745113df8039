"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueFieldDefinitionNamesRule = UniqueFieldDefinitionNamesRule;
const graphql_1 = require("graphql");
function UniqueFieldDefinitionNamesRule(context) {
    const knownFieldNames = new Map();
    return {
        InputObjectTypeDefinition: checkFieldUniqueness,
        InputObjectTypeExtension: checkFieldUniqueness,
        InterfaceTypeDefinition: checkFieldUniqueness,
        InterfaceTypeExtension: checkFieldUniqueness,
        ObjectTypeDefinition: checkFieldUniqueness,
        ObjectTypeExtension: checkFieldUniqueness,
    };
    function checkFieldUniqueness(node) {
        const typeName = node.name.value;
        if (!knownFieldNames.has(typeName)) {
            knownFieldNames.set(typeName, new Set());
        }
        const fieldNodes = node.fields ?? [];
        const fieldNames = knownFieldNames.get(typeName);
        for (const fieldDef of fieldNodes) {
            const fieldName = fieldDef.name.value;
            if (fieldNames.has(fieldName)) {
                context.reportError(new graphql_1.GraphQLError(`Field "${typeName}.${fieldName}" can only be defined once.`, {
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
            else {
                fieldNames.add(fieldName);
            }
        }
    }
}
