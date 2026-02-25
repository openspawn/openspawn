"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueEnumValueNamesRule = UniqueEnumValueNamesRule;
const graphql_1 = require("graphql");
function UniqueEnumValueNamesRule(context) {
    const knownValueNames = new Map();
    return {
        EnumTypeDefinition: checkValueUniqueness,
        EnumTypeExtension: checkValueUniqueness,
    };
    function checkValueUniqueness(node) {
        const typeName = node.name.value;
        if (!knownValueNames.has(typeName)) {
            knownValueNames.set(typeName, new Set());
        }
        const valueNodes = node.values ?? [];
        const valueNames = knownValueNames.get(typeName);
        for (const valueDef of valueNodes) {
            const valueName = valueDef.name.value;
            if (valueNames.has(valueName)) {
                context.reportError(new graphql_1.GraphQLError(`Enum value "${typeName}.${valueName}" can only be defined once.`, {
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
            else {
                valueNames.add(valueName);
            }
        }
    }
}
