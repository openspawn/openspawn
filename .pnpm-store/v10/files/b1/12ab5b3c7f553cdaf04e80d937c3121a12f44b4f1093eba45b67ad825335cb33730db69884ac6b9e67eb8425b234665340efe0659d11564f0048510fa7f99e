import { GraphQLError, Kind } from "graphql";
import { validateDirectiveAgainstOriginal } from "../../../helpers.js";
export function ShareableRules(context) {
    return {
        DirectiveDefinition(node) {
            validateDirectiveAgainstOriginal(node, "shareable", context);
        },
        Directive(node) {
            if (!context.isAvailableFederationDirective("shareable", node)) {
                return;
            }
            const typeDef = context.typeNodeInfo.getTypeDef();
            const fieldDef = context.typeNodeInfo.getFieldDef();
            if (!typeDef) {
                return;
            }
            if ((typeDef.kind === Kind.OBJECT_TYPE_DEFINITION ||
                typeDef.kind === Kind.OBJECT_TYPE_EXTENSION) &&
                !context.stateBuilder.isInterfaceObject(typeDef.name.value)) {
                if (fieldDef) {
                    context.stateBuilder.objectType.field.setShareable(typeDef.name.value, fieldDef.name.value);
                }
                else {
                    context.stateBuilder.objectType.setShareable(typeDef.name.value);
                    if (typeDef.fields) {
                        for (const fieldDef of typeDef.fields) {
                            context.stateBuilder.objectType.field.setShareable(typeDef.name.value, fieldDef.name.value);
                        }
                    }
                }
            }
            if (!fieldDef) {
                return;
            }
            if (typeDef.kind === Kind.INTERFACE_TYPE_DEFINITION ||
                typeDef.kind === Kind.INTERFACE_TYPE_EXTENSION) {
                context.reportError(new GraphQLError(`Invalid use of @shareable on field "${typeDef.name.value}.${fieldDef.name.value}": only object type fields can be marked with @shareable`, {
                    nodes: node,
                    extensions: { code: "INVALID_SHAREABLE_USAGE" },
                }));
                return;
            }
        },
    };
}
