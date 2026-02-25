import { GraphQLError } from "graphql";
export function DefaultValueUsesInaccessibleRule(context, supergraph) {
    return {
        InputObjectTypeField(inputObjectState, fieldState) {
            if (typeof fieldState.defaultValue !== "string" ||
                fieldState.inaccessible) {
                return;
            }
            detectInaccessibleDefaultValue(context, () => `${inputObjectState.name}.${fieldState.name}`, fieldState.type, fieldState.defaultValue, supergraph.enumTypes);
        },
        ObjectTypeFieldArg(objectState, fieldState, argState) {
            if (typeof argState.defaultValue !== "string") {
                return;
            }
            if (argState.inaccessible) {
                return;
            }
            detectInaccessibleDefaultValue(context, () => `${objectState.name}.${fieldState.name}(${argState.name}:)`, argState.type, argState.defaultValue, supergraph.enumTypes);
        },
    };
}
function detectInaccessibleDefaultValue(context, schemaCoordinate, outputType, defaultValue, enumTypes) {
    const outputTypeName = outputType.replace(/[\[\]\!]+/g, "");
    const enumType = enumTypes.get(outputTypeName);
    if (!enumType) {
        return;
    }
    if (enumType.inaccessible === true ||
        enumType.values.get(defaultValue)?.inaccessible === true) {
        context.reportError(new GraphQLError(`Enum value "${outputTypeName}.${defaultValue}" is @inaccessible but is used in the default value of "${schemaCoordinate()}", which is in the API schema.`, {
            extensions: {
                code: "DEFAULT_VALUE_USES_INACCESSIBLE",
            },
        }));
    }
}
