import { Kind } from "graphql";
import { validateDirectiveAgainstOriginal } from "../../../helpers.js";
export function ExtendsRules(context) {
    return {
        DirectiveDefinition(node) {
            validateDirectiveAgainstOriginal(node, "extends", context);
        },
        Directive(node) {
            if (!context.isAvailableFederationDirective("extends", node)) {
                return;
            }
            const typeDef = context.typeNodeInfo.getTypeDef();
            if (!typeDef ||
                !(typeDef.kind === Kind.OBJECT_TYPE_DEFINITION ||
                    typeDef.kind === Kind.INTERFACE_TYPE_DEFINITION)) {
                return;
            }
            if (typeDef.kind === Kind.OBJECT_TYPE_DEFINITION) {
                context.stateBuilder.objectType.setExtension(typeDef.name.value, "@extends");
            }
            else {
                context.stateBuilder.interfaceType.setExtension(typeDef.name.value);
            }
            const fields = typeDef.fields;
            for (const field of fields ?? []) {
                context.markAsUsed("@extends", typeDef.kind, typeDef.name.value, field.name.value);
            }
        },
    };
}
