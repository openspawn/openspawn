"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiresScopesRule = RequiresScopesRule;
const graphql_1 = require("graphql");
const printer_js_1 = require("../../../../graphql/printer.js");
const helpers_js_1 = require("../../../helpers.js");
function RequiresScopesRule(context) {
    return {
        DirectiveDefinition(node) {
            (0, helpers_js_1.validateDirectiveAgainstOriginal)(node, "requiresScopes", context);
        },
        Directive(node, _key, _parent, paths, ancestors) {
            if (!context.isAvailableFederationDirective("requiresScopes", node)) {
                return;
            }
            const scopesArg = node.arguments?.find((arg) => arg.name.value === "scopes");
            if (!scopesArg) {
                throw new Error('Expected @requiresScopes to have a "scopes" argument');
            }
            if (scopesArg.value.kind !== graphql_1.Kind.LIST) {
                throw new Error('Expected "@requiresScopes(scopes:)" to be a list');
            }
            const scopes = [];
            for (const scopesValues of scopesArg.value.values) {
                if (scopesValues.kind !== graphql_1.Kind.LIST) {
                    throw new Error('Expected "@requiresScopes(scopes:)" to be in [[requiresScopes__Scope!]!]! format');
                }
                const scopesOR = [];
                for (const scope of scopesValues.values) {
                    if (scope.kind !== graphql_1.Kind.STRING) {
                        throw new Error(`Expected "@requiresScopes(scopes:)" to be in [[requiresScopes__Scope!]!]! format, received [[${(0, printer_js_1.print)(scopesArg.value)}]!]!`);
                    }
                    scopesOR.push(scope.value);
                }
                scopes.push(scopesOR);
            }
            context.stateBuilder.markSpecAsUsed("requiresScopes");
            const directivesKeyAt = paths.findIndex((path) => path === "directives");
            if (directivesKeyAt === -1) {
                throw new Error('Could not find "directives" key in ancestors');
            }
            const parent = ancestors[directivesKeyAt];
            if (!parent) {
                throw new Error("Could not find the node annotated with @requiresScopes");
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
                        throw new Error("Could not find the parent type of the field annotated with @requiresScopes");
                    }
                    if (typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION ||
                        typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_EXTENSION) {
                        context.reportError(new graphql_1.GraphQLError(`Invalid use of @requiresScopes on field "${typeDef.name.value}.${parent.name.value}": @requiresScopes cannot be applied on interfaces, interface fields and interface objects`, {
                            extensions: {
                                code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                            },
                        }));
                        return;
                    }
                    if (typeDef.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                        typeDef.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION) {
                        context.stateBuilder.objectType.field.setScopes(typeDef.name.value, parent.name.value, scopes);
                    }
                    break;
                }
                case graphql_1.Kind.OBJECT_TYPE_DEFINITION:
                case graphql_1.Kind.OBJECT_TYPE_EXTENSION:
                    if (context.stateBuilder.isInterfaceObject(parent.name.value)) {
                        context.reportError(new graphql_1.GraphQLError(`Invalid use of @requiresScopes on interface object "${parent.name.value}": @requiresScopes cannot be applied on interfaces, interface fields and interface objects`, {
                            extensions: {
                                code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                            },
                        }));
                        return;
                    }
                    context.stateBuilder.objectType.setScopes(parent.name.value, scopes);
                    break;
                case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
                case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
                    context.reportError(new graphql_1.GraphQLError(`Invalid use of @requiresScopes on interface "${parent.name.value}": @requiresScopes cannot be applied on interfaces, interface fields and interface objects`, {
                        extensions: {
                            code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                        },
                    }));
                    return;
                case graphql_1.Kind.SCALAR_TYPE_DEFINITION:
                case graphql_1.Kind.SCALAR_TYPE_EXTENSION:
                    context.stateBuilder.scalarType.setScopes(parent.name.value, scopes);
                    break;
                case graphql_1.Kind.ENUM_TYPE_DEFINITION:
                case graphql_1.Kind.ENUM_TYPE_EXTENSION:
                    context.stateBuilder.enumType.setScopes(parent.name.value, scopes);
                    break;
            }
        },
    };
}
