"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceObjectRules = InterfaceObjectRules;
const graphql_1 = require("graphql");
const helpers_js_1 = require("../../../helpers.js");
function InterfaceObjectRules(context) {
    return {
        DirectiveDefinition(node) {
            (0, helpers_js_1.validateDirectiveAgainstOriginal)(node, "interfaceObject", context);
        },
        Directive(node) {
            if (!context.isAvailableFederationDirective("interfaceObject", node)) {
                return;
            }
            if (context.satisfiesVersionRange("< v2.3")) {
                context.reportError(new graphql_1.GraphQLError(`@interfaceObject is not yet supported. See https://github.com/graphql-hive/federation-composition/issues/7`, {
                    extensions: { code: "UNSUPPORTED_FEATURE" },
                }));
                return;
            }
            const typeDef = context.typeNodeInfo.getTypeDef();
            if (!typeDef) {
                return;
            }
            if (typeDef.kind !== graphql_1.Kind.OBJECT_TYPE_DEFINITION &&
                typeDef.kind !== graphql_1.Kind.OBJECT_TYPE_EXTENSION) {
                return;
            }
            if (!typeDef.directives?.some((d) => d.name.value === "key")) {
                context.reportError(new graphql_1.GraphQLError(`The @interfaceObject directive can only be applied to entity types but type "${typeDef.name.value}" has no @key in this subgraph.`, {
                    extensions: { code: "INTERFACE_OBJECT_USAGE_ERROR" },
                }));
            }
        },
    };
}
