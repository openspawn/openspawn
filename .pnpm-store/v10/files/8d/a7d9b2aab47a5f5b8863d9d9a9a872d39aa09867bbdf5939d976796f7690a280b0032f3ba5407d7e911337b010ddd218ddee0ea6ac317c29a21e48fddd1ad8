import { GraphQLError } from "graphql";
export function OnlyInaccessibleChildrenRule(context) {
    return {
        EnumType(enumState) {
            if (enumState.inaccessible === false &&
                areAllInaccessible(enumState.values)) {
                context.reportError(new GraphQLError(`Type "${enumState.name}" is in the API schema but all of its values are @inaccessible.`, {
                    extensions: {
                        code: "ONLY_INACCESSIBLE_CHILDREN",
                    },
                }));
            }
        },
        ObjectType(objectState) {
            if (objectState.inaccessible === false &&
                areAllInaccessible(objectState.fields)) {
                context.reportError(new GraphQLError(`Type "${objectState.name}" is in the API schema but all of its fields are @inaccessible.`, {
                    extensions: {
                        code: "ONLY_INACCESSIBLE_CHILDREN",
                    },
                }));
            }
        },
        InterfaceType(interfaceState) {
            if (interfaceState.inaccessible === false &&
                areAllInaccessible(interfaceState.fields)) {
                context.reportError(new GraphQLError(`Type "${interfaceState.name}" is in the API schema but all of its fields are @inaccessible.`, {
                    extensions: {
                        code: "ONLY_INACCESSIBLE_CHILDREN",
                    },
                }));
            }
        },
        InputObjectType(inputObjectTypeState) {
            if (inputObjectTypeState.inaccessible === false &&
                areAllInaccessible(inputObjectTypeState.fields)) {
                context.reportError(new GraphQLError(`Type "${inputObjectTypeState.name}" is in the API schema but all of its fields are @inaccessible.`, {
                    extensions: {
                        code: "ONLY_INACCESSIBLE_CHILDREN",
                    },
                }));
            }
        },
    };
}
function areAllInaccessible(childrenMap) {
    return Array.from(childrenMap.values()).every((f) => f.inaccessible === true);
}
