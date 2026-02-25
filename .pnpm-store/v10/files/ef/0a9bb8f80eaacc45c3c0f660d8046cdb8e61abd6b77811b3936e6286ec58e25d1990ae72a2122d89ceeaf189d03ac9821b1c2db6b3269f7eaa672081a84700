import { GraphQLError, isTypeDefinitionNode, isTypeExtensionNode, Kind, } from "graphql";
export function UniqueDirectivesPerLocationRule(context) {
    const uniqueDirectiveMap = new Map();
    const astDefinitions = context.getDocument().definitions;
    for (const def of astDefinitions) {
        if (def.kind === Kind.DIRECTIVE_DEFINITION) {
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
            if (node.kind === Kind.SCHEMA_DEFINITION ||
                node.kind === Kind.SCHEMA_EXTENSION) {
                seenDirectives = schemaDirectives;
            }
            else if (isTypeDefinitionNode(node) || isTypeExtensionNode(node)) {
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
                        context.reportError(new GraphQLError(`The directive "@${directiveName}" can only be used once at this location.`, {
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
