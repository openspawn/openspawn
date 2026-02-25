"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferencedInaccessibleRule = ReferencedInaccessibleRule;
const graphql_1 = require("graphql");
function ReferencedInaccessibleRule(context, supergraph) {
    return {
        ObjectTypeField(objectState, fieldState) {
            const outputTypeName = fieldState.type.replace(/[\[\]\!]+/g, "");
            const referencesInaccessible = findOutputType(supergraph, outputTypeName)?.inaccessible === true;
            const isInaccessible = fieldState.inaccessible === true || objectState.inaccessible === true;
            if (referencesInaccessible && !isInaccessible) {
                context.reportError(new graphql_1.GraphQLError(`Type "${outputTypeName}" is @inaccessible but is referenced by "${objectState.name}.${fieldState.name}", which is in the API schema.`, {
                    extensions: {
                        code: "REFERENCED_INACCESSIBLE",
                    },
                }));
            }
        },
        ObjectTypeFieldArg(objectState, fieldState, argState) {
            const outputTypeName = argState.type.replace(/[\[\]\!]+/g, "");
            const referencesInaccessible = findInputType(supergraph, outputTypeName)?.inaccessible === true;
            const isInaccessible = argState.inaccessible === true ||
                fieldState.inaccessible === true ||
                objectState.inaccessible === true;
            if (referencesInaccessible && !isInaccessible) {
                context.reportError(new graphql_1.GraphQLError(`Type "${outputTypeName}" is @inaccessible but is referenced by "${objectState.name}.${fieldState.name}(${argState.name}:)", which is in the API schema.`, {
                    extensions: {
                        code: "REFERENCED_INACCESSIBLE",
                    },
                }));
            }
        },
    };
}
function findOutputType(supergraph, typeName) {
    return (supergraph.enumTypes.get(typeName) ||
        supergraph.objectTypes.get(typeName) ||
        supergraph.interfaceTypes.get(typeName) ||
        supergraph.unionTypes.get(typeName) ||
        supergraph.scalarTypes.get(typeName));
}
function findInputType(supergraph, typeName) {
    return (supergraph.enumTypes.get(typeName) ||
        supergraph.inputObjectTypes.get(typeName));
}
