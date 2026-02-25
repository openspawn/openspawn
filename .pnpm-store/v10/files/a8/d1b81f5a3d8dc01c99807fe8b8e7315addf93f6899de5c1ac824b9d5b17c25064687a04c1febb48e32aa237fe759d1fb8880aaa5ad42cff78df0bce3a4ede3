"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnlyInterfaceImplementationRule = OnlyInterfaceImplementationRule;
const graphql_1 = require("graphql");
function OnlyInterfaceImplementationRule(context) {
    const { definitions } = context.getDocument();
    let filled = false;
    const typeNameToKind = new Map();
    function fillTypeNameToKindMap() {
        for (const node of definitions) {
            switch (node.kind) {
                case graphql_1.Kind.OBJECT_TYPE_DEFINITION:
                case graphql_1.Kind.OBJECT_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "ObjectType");
                    break;
                case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
                case graphql_1.Kind.INTERFACE_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "InterfaceType");
                    break;
                case graphql_1.Kind.UNION_TYPE_DEFINITION:
                case graphql_1.Kind.UNION_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "UnionType");
                    break;
                case graphql_1.Kind.ENUM_TYPE_DEFINITION:
                case graphql_1.Kind.ENUM_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "EnumType");
                    break;
                case graphql_1.Kind.SCALAR_TYPE_DEFINITION:
                case graphql_1.Kind.SCALAR_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "ScalarType");
                    break;
                case graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION:
                case graphql_1.Kind.INPUT_OBJECT_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "InputObjectType");
                    break;
            }
        }
        filled = true;
    }
    function findKindByName(typeName) {
        if (!filled) {
            fillTypeNameToKindMap();
        }
        return typeNameToKind.get(typeName);
    }
    function check(node) {
        if (!node.interfaces) {
            return;
        }
        for (const interfaceNode of node.interfaces) {
            const interfaceName = interfaceNode.name.value;
            const kind = findKindByName(interfaceName);
            if (kind && kind !== "InterfaceType") {
                context.reportError(new graphql_1.GraphQLError(`Cannot implement non-interface type ${interfaceName} (of type ObjectType)`, {
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
        }
    }
    return {
        ObjectTypeDefinition: check,
        ObjectTypeExtension: check,
    };
}
