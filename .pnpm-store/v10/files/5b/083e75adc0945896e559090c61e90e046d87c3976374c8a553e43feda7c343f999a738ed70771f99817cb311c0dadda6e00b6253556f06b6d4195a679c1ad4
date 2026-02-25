"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnownFederationDirectivesRule = KnownFederationDirectivesRule;
const graphql_1 = require("graphql");
function KnownFederationDirectivesRule(context) {
    const availableDirectivesSet = new Set();
    const knownDirectivesSet = new Set();
    const knownDirectives = context.getKnownFederationDirectives();
    for (const directive of knownDirectives) {
        knownDirectivesSet.add(directive.name.value);
    }
    const availableDirectives = context.getAvailableFederationDirectives();
    for (const directive of availableDirectives) {
        availableDirectivesSet.add(directive.name.value);
    }
    const astDefinitions = context.getDocument().definitions;
    for (const def of astDefinitions) {
        if (def.kind === graphql_1.Kind.DIRECTIVE_DEFINITION) {
            availableDirectivesSet.add(def.name.value);
        }
    }
    return {
        Directive(node) {
            const name = node.name.value;
            if (!availableDirectivesSet.has(name) && name === "interfaceObject") {
                context.reportError(new graphql_1.GraphQLError(`Unknown directive "@interfaceObject". If you meant the "@interfaceObject" federation 2 directive, note that this schema is a federation 1 schema. To be a federation 2 schema, it needs to @link to the federation specification v2.`, { nodes: node, extensions: { code: "INVALID_GRAPHQL" } }));
                return;
            }
            if (!availableDirectivesSet.has(name) &&
                knownDirectivesSet.has(name) &&
                !name.startsWith("federation__")) {
                context.reportError(new graphql_1.GraphQLError(`Unknown directive "@${name}". If you meant the "@${name}" federation directive, you should use fully-qualified name "@federation__${name}" or add "@${name}" to the \`import\` argument of the @link to the federation specification.`, { nodes: node, extensions: { code: "INVALID_GRAPHQL" } }));
                return;
            }
        },
    };
}
