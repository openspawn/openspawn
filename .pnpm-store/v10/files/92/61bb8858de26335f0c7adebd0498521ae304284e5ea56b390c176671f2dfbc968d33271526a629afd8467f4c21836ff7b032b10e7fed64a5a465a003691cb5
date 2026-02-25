import { GraphQLError, Kind, } from "graphql";
export function OnlyInterfaceImplementationRule(context) {
    const { definitions } = context.getDocument();
    let filled = false;
    const typeNameToKind = new Map();
    function fillTypeNameToKindMap() {
        for (const node of definitions) {
            switch (node.kind) {
                case Kind.OBJECT_TYPE_DEFINITION:
                case Kind.OBJECT_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "ObjectType");
                    break;
                case Kind.INTERFACE_TYPE_DEFINITION:
                case Kind.INTERFACE_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "InterfaceType");
                    break;
                case Kind.UNION_TYPE_DEFINITION:
                case Kind.UNION_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "UnionType");
                    break;
                case Kind.ENUM_TYPE_DEFINITION:
                case Kind.ENUM_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "EnumType");
                    break;
                case Kind.SCALAR_TYPE_DEFINITION:
                case Kind.SCALAR_TYPE_EXTENSION:
                    typeNameToKind.set(node.name.value, "ScalarType");
                    break;
                case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                case Kind.INPUT_OBJECT_TYPE_EXTENSION:
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
                context.reportError(new GraphQLError(`Cannot implement non-interface type ${interfaceName} (of type ObjectType)`, {
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
