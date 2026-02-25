"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendsRules = ExtendsRules;
const graphql_1 = require("graphql");
const helpers_js_1 = require("../../../helpers.js");
function ExtendsRules(context) {
    return {
        DirectiveDefinition(node) {
            (0, helpers_js_1.validateDirectiveAgainstOriginal)(node, "extends", context);
        },
        Directive(node) {
            if (!context.isAvailableFederationDirective("extends", node)) {
                return;
            }
            const typeDef = context.typeNodeInfo.getTypeDef();
            if (!typeDef ||
                !(typeDef.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                    typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION)) {
                return;
            }
            if (typeDef.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION) {
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
