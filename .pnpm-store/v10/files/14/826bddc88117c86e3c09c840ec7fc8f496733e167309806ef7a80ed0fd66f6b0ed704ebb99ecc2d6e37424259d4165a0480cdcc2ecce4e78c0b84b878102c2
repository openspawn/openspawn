"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnownDirectivesRule = KnownDirectivesRule;
const graphql_1 = require("graphql");
function KnownDirectivesRule(context) {
    const locationsMap = new Map();
    const astDefinitions = context.getDocument().definitions;
    for (const def of astDefinitions) {
        if (def.kind === graphql_1.Kind.DIRECTIVE_DEFINITION) {
            locationsMap.set(def.name.value, new Set(def.locations.map((name) => name.value)));
        }
    }
    for (const specifiedDirective of graphql_1.specifiedDirectives) {
        if (!locationsMap.has(specifiedDirective.name)) {
            locationsMap.set(specifiedDirective.name, new Set(specifiedDirective.locations.map((loc) => String(loc))));
        }
    }
    return {
        Directive(node, _key, _parent, _path, ancestors) {
            const name = node.name.value;
            const locations = locationsMap.get(name);
            if (!locations) {
                context.reportError(new graphql_1.GraphQLError(`Unknown directive "@${name}".`, {
                    nodes: node,
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
                return;
            }
            const candidateLocation = getDirectiveLocationForASTPath(ancestors);
            if (candidateLocation && !locations.has(candidateLocation)) {
                context.reportError(new graphql_1.GraphQLError(`Directive "@${name}" may not be used on ${candidateLocation}.`, {
                    nodes: node,
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
        },
    };
}
function getDirectiveLocationForASTPath(ancestors) {
    const appliedTo = ancestors[ancestors.length - 1];
    if (!("kind" in appliedTo)) {
        throw new Error("Expected a node");
    }
    switch (appliedTo.kind) {
        case graphql_1.Kind.OPERATION_DEFINITION:
            return getDirectiveLocationForOperation(appliedTo.operation);
        case graphql_1.Kind.FIELD:
            return graphql_1.DirectiveLocation.FIELD;
        case graphql_1.Kind.FRAGMENT_SPREAD:
            return graphql_1.DirectiveLocation.FRAGMENT_SPREAD;
        case graphql_1.Kind.INLINE_FRAGMENT:
            return graphql_1.DirectiveLocation.INLINE_FRAGMENT;
        case graphql_1.Kind.FRAGMENT_DEFINITION:
            return graphql_1.DirectiveLocation.FRAGMENT_DEFINITION;
        case graphql_1.Kind.VARIABLE_DEFINITION:
            return graphql_1.DirectiveLocation.VARIABLE_DEFINITION;
        case graphql_1.Kind.SCHEMA_DEFINITION:
        case graphql_1.Kind.SCHEMA_EXTENSION:
            return graphql_1.DirectiveLocation.SCHEMA;
        case graphql_1.Kind.SCALAR_TYPE_DEFINITION:
        case graphql_1.Kind.SCALAR_TYPE_EXTENSION:
            return graphql_1.DirectiveLocation.SCALAR;
        case graphql_1.Kind.OBJECT_TYPE_DEFINITION:
        case graphql_1.Kind.OBJECT_TYPE_EXTENSION:
            return graphql_1.DirectiveLocation.OBJECT;
        case graphql_1.Kind.FIELD_DEFINITION:
            return graphql_1.DirectiveLocation.FIELD_DEFINITION;
        case graphql_1.Kind.INTERFACE_TYPE_DEFINITION:
        case graphql_1.Kind.INTERFACE_TYPE_EXTENSION:
            return graphql_1.DirectiveLocation.INTERFACE;
        case graphql_1.Kind.UNION_TYPE_DEFINITION:
        case graphql_1.Kind.UNION_TYPE_EXTENSION:
            return graphql_1.DirectiveLocation.UNION;
        case graphql_1.Kind.ENUM_TYPE_DEFINITION:
        case graphql_1.Kind.ENUM_TYPE_EXTENSION:
            return graphql_1.DirectiveLocation.ENUM;
        case graphql_1.Kind.ENUM_VALUE_DEFINITION:
            return graphql_1.DirectiveLocation.ENUM_VALUE;
        case graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION:
        case graphql_1.Kind.INPUT_OBJECT_TYPE_EXTENSION:
            return graphql_1.DirectiveLocation.INPUT_OBJECT;
        case graphql_1.Kind.INPUT_VALUE_DEFINITION: {
            const parentNode = ancestors[ancestors.length - 3];
            if (!("kind" in parentNode)) {
                throw new Error("Expected a node");
            }
            return parentNode.kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION
                ? graphql_1.DirectiveLocation.INPUT_FIELD_DEFINITION
                : graphql_1.DirectiveLocation.ARGUMENT_DEFINITION;
        }
    }
}
function getDirectiveLocationForOperation(operation) {
    switch (operation) {
        case graphql_1.OperationTypeNode.QUERY:
            return graphql_1.DirectiveLocation.QUERY;
        case graphql_1.OperationTypeNode.MUTATION:
            return graphql_1.DirectiveLocation.MUTATION;
        case graphql_1.OperationTypeNode.SUBSCRIPTION:
            return graphql_1.DirectiveLocation.SUBSCRIPTION;
    }
}
