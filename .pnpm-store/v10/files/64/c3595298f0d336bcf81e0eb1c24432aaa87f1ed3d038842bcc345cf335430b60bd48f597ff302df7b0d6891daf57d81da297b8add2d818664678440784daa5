"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldSetRules = FieldSetRules;
const graphql_1 = require("graphql");
function FieldSetRules(context) {
    function validateFieldSet(node, receivedType) {
        if (node.name.value === "FieldSet" &&
            context.isAvailableFederationType("FieldSet")) {
            context.reportError(new graphql_1.GraphQLError(`Invalid definition for type FieldSet: FieldSet should be a ScalarType but is defined as a ${receivedType}`, {
                nodes: node,
                extensions: { code: "TYPE_DEFINITION_INVALID" },
            }));
        }
    }
    return {
        ScalarTypeDefinition(node) {
            if (node.name.value === "FieldSet" &&
                context.isAvailableFederationType("FieldSet")) {
                context.markAsFederationDefinitionReplacement("FieldSet");
            }
        },
        ObjectTypeDefinition(node) {
            validateFieldSet(node, "ObjectType");
        },
        InterfaceTypeDefinition(node) {
            validateFieldSet(node, "InterfaceType");
        },
        UnionTypeDefinition(node) {
            validateFieldSet(node, "UnionType");
        },
        EnumTypeDefinition(node) {
            validateFieldSet(node, "EnumType");
        },
        InputObjectTypeDefinition(node) {
            validateFieldSet(node, "InputObjectType");
        },
    };
}
