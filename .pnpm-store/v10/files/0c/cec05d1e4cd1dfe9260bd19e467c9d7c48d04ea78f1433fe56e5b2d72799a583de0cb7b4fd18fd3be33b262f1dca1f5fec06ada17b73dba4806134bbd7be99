"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShareableRules = ShareableRules;
const graphql_1 = require("graphql");
const helpers_js_1 = require("../../../helpers.js");
function ShareableRules(context) {
    return {
        DirectiveDefinition(node) {
            (0, helpers_js_1.validateDirectiveAgainstOriginal)(node, "shareable", context);
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
            if ((typeDef.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                typeDef.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION) &&
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
            if (typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION ||
                typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_EXTENSION) {
                context.reportError(new graphql_1.GraphQLError(`Invalid use of @shareable on field "${typeDef.name.value}.${fieldDef.name.value}": only object type fields can be marked with @shareable`, {
                    nodes: node,
                    extensions: { code: "INVALID_SHAREABLE_USAGE" },
                }));
                return;
            }
        },
    };
}
