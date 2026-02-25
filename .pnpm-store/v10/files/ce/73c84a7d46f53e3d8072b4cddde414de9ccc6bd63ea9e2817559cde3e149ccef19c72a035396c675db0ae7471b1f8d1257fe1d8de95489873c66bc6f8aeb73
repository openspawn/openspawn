"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticatedRule = AuthenticatedRule;
const graphql_1 = require("graphql");
const helpers_js_1 = require("../../../helpers.js");
function AuthenticatedRule(context) {
    return {
        DirectiveDefinition(node) {
            (0, helpers_js_1.validateDirectiveAgainstOriginal)(node, "authenticated", context);
        },
        Directive(node, _key, _parent, paths, ancestors) {
            if (!context.isAvailableFederationDirective("authenticated", node)) {
                return;
            }
            context.stateBuilder.markSpecAsUsed("authenticated");
            const directivesKeyAt = paths.findIndex((path) => path === "directives");
            if (directivesKeyAt === -1) {
                throw new Error('Could not find "directives" key in ancestors');
            }
            const parent = ancestors[directivesKeyAt];
            if (!parent) {
                throw new Error("Could not find the node annotated with @authenticated");
            }
            if (Array.isArray(parent)) {
                throw new Error("Expected parent to be a single node");
            }
            if (!("kind" in parent)) {
                throw new Error("Expected parent to be a node");
            }
            switch (parent.kind) {
                case graphql_1.Kind.FIELD_DEFINITION: {
                    const typeDef = context.typeNodeInfo.getTypeDef();
                    if (!typeDef) {
                        throw new Error("Could not find the parent type of the field annotated with @authenticated");
                    }
                    if (typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION ||
                        typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_EXTENSION) {
                        context.reportError(new graphql_1.GraphQLError(`Invalid use of @authenticated on field "${typeDef.name.value}.${parent.name.value}": @authenticated cannot be applied on interfaces, interface fields and interface objects`, {
                            extensions: {
                                code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                            },
                        }));
                        return;
                    }
                    if (typeDef.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                        typeDef.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION) {
                        context.stateBuilder.objectType.field.setAuthenticated(typeDef.name.value, parent.name.value);
                    }
                    break;
                }
                case graphql_1.Kind.OBJECT_TYPE_DEFINITION:
                case graphql_1.Kind.OBJECT_TYPE_EXTENSION:
                    if (context.stateBuilder.isInterfaceObject(parent.name.value)) {
                        context.reportError(new graphql_1.GraphQLError(`Invalid use of @authenticated on interface object "${parent.name.value}": @authenticated cannot be applied on interfaces, interface fields and interface objects`, {
                            extensions: {
                                code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                            },
                        }));
                        return;
                    }
                    context.stateBuilder.objectType.setAuthenticated(parent.name.value);
                    break;
                case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
                case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
                    context.reportError(new graphql_1.GraphQLError(`Invalid use of @authenticated on interface "${parent.name.value}": @authenticated cannot be applied on interfaces, interface fields and interface objects`, {
                        extensions: {
                            code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                        },
                    }));
                    return;
                case graphql_1.Kind.SCALAR_TYPE_DEFINITION:
                case graphql_1.Kind.SCALAR_TYPE_EXTENSION:
                    context.stateBuilder.scalarType.setAuthenticated(parent.name.value);
                    break;
                case graphql_1.Kind.ENUM_TYPE_DEFINITION:
                case graphql_1.Kind.ENUM_TYPE_EXTENSION:
                    context.stateBuilder.enumType.setAuthenticated(parent.name.value);
                    break;
            }
        },
    };
}
