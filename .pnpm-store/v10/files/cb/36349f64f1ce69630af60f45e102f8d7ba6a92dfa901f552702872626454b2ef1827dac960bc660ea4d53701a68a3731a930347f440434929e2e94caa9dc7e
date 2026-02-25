"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueDirectivesPerLocationRule = UniqueDirectivesPerLocationRule;
const graphql_1 = require("graphql");
function UniqueDirectivesPerLocationRule(context) {
    const uniqueDirectiveMap = new Map();
    const astDefinitions = context.getDocument().definitions;
    for (const def of astDefinitions) {
        if (def.kind === graphql_1.Kind.DIRECTIVE_DEFINITION) {
            uniqueDirectiveMap.set(def.name.value, !def.repeatable);
        }
    }
    const schemaDirectives = new Set();
    const typeDirectivesMap = new Map();
    return {
        enter(node) {
            if (!("directives" in node) || !node.directives) {
                return;
            }
            let seenDirectives;
            if (node.kind === graphql_1.Kind.SCHEMA_DEFINITION ||
                node.kind === graphql_1.Kind.SCHEMA_EXTENSION) {
                seenDirectives = schemaDirectives;
            }
            else if ((0, graphql_1.isTypeDefinitionNode)(node) || (0, graphql_1.isTypeExtensionNode)(node)) {
                const typeName = node.name.value;
                if (!typeDirectivesMap.has(typeName)) {
                    typeDirectivesMap.set(typeName, new Set());
                }
                seenDirectives = typeDirectivesMap.get(typeName);
            }
            else {
                seenDirectives = new Set();
            }
            for (const directive of node.directives) {
                const directiveName = directive.name.value;
                if (uniqueDirectiveMap.get(directiveName)) {
                    if (seenDirectives.has(directiveName)) {
                        context.reportError(new graphql_1.GraphQLError(`The directive "@${directiveName}" can only be used once at this location.`, {
                            extensions: {
                                code: "INVALID_GRAPHQL",
                            },
                        }));
                    }
                    else {
                        seenDirectives.add(directive.name.value);
                    }
                }
            }
        },
    };
}
