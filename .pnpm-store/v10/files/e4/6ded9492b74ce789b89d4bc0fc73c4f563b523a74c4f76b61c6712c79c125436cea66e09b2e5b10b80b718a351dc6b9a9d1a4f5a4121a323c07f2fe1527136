"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyRule = PolicyRule;
const graphql_1 = require("graphql");
const printer_js_1 = require("../../../../graphql/printer.js");
const helpers_js_1 = require("../../../helpers.js");
function PolicyRule(context) {
    return {
        DirectiveDefinition(node) {
            (0, helpers_js_1.validateDirectiveAgainstOriginal)(node, "policy", context);
        },
        Directive(node, _key, _parent, paths, ancestors) {
            if (!context.isAvailableFederationDirective("policy", node)) {
                return;
            }
            const policiesArg = node.arguments?.find((arg) => arg.name.value === "policies");
            if (!policiesArg) {
                throw new Error('Expected @policy to have a "policies" argument');
            }
            if (policiesArg.value.kind !== graphql_1.Kind.LIST) {
                throw new Error('Expected "@policy(policies:)" to be a list');
            }
            const policies = [];
            for (const policyValues of policiesArg.value.values) {
                if (policyValues.kind !== graphql_1.Kind.LIST) {
                    throw new Error('Expected "@policy(policies:)" to be in [[policy__Policy!]!]! format');
                }
                const policyOR = [];
                for (const policy of policyValues.values) {
                    if (policy.kind !== graphql_1.Kind.STRING) {
                        throw new Error(`Expected "@policy(policies:)" to be in [[policy__Policy!]!]! format, received [[${(0, printer_js_1.print)(policiesArg.value)}]!]!`);
                    }
                    policyOR.push(policy.value);
                }
                policies.push(policyOR);
            }
            context.stateBuilder.markSpecAsUsed("policy");
            const directivesKeyAt = paths.findIndex((path) => path === "directives");
            if (directivesKeyAt === -1) {
                throw new Error('Could not find "directives" key in ancestors');
            }
            const parent = ancestors[directivesKeyAt];
            if (!parent) {
                throw new Error("Could not find the node annotated with @policy");
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
                        throw new Error("Could not find the parent type of the field annotated with @policy");
                    }
                    if (typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION ||
                        typeDef.kind === graphql_1.Kind.INTERFACE_TYPE_EXTENSION) {
                        context.reportError(new graphql_1.GraphQLError(`Invalid use of @policy on field "${typeDef.name.value}.${parent.name.value}": @policy cannot be applied on interfaces, interface fields and interface objects`, {
                            extensions: {
                                code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                            },
                        }));
                        return;
                    }
                    if (typeDef.kind === graphql_1.Kind.OBJECT_TYPE_DEFINITION ||
                        typeDef.kind === graphql_1.Kind.OBJECT_TYPE_EXTENSION) {
                        context.stateBuilder.objectType.field.setPolicies(typeDef.name.value, parent.name.value, policies);
                    }
                    break;
                }
                case graphql_1.Kind.OBJECT_TYPE_DEFINITION:
                case graphql_1.Kind.OBJECT_TYPE_EXTENSION:
                    if (context.stateBuilder.isInterfaceObject(parent.name.value)) {
                        context.reportError(new graphql_1.GraphQLError(`Invalid use of @policy on interface object "${parent.name.value}": @policy cannot be applied on interfaces, interface fields and interface objects`, {
                            extensions: {
                                code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                            },
                        }));
                        return;
                    }
                    context.stateBuilder.objectType.setPolicies(parent.name.value, policies);
                    break;
                case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
                case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
                    context.reportError(new graphql_1.GraphQLError(`Invalid use of @policy on interface "${parent.name.value}": @policy cannot be applied on interfaces, interface fields and interface objects`, {
                        extensions: {
                            code: "AUTH_REQUIREMENTS_APPLIED_ON_INTERFACE",
                        },
                    }));
                    return;
                case graphql_1.Kind.SCALAR_TYPE_DEFINITION:
                case graphql_1.Kind.SCALAR_TYPE_EXTENSION:
                    context.stateBuilder.scalarType.setPolicies(parent.name.value, policies);
                    break;
                case graphql_1.Kind.ENUM_TYPE_DEFINITION:
                case graphql_1.Kind.ENUM_TYPE_EXTENSION:
                    context.stateBuilder.enumType.setPolicies(parent.name.value, policies);
                    break;
            }
        },
    };
}
