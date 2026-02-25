"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnownArgumentNamesOnDirectivesRule = KnownArgumentNamesOnDirectivesRule;
const graphql_1 = require("graphql");
function KnownArgumentNamesOnDirectivesRule(context) {
    const directiveArgs = new Map();
    const astDefinitions = context.getDocument().definitions;
    for (const def of astDefinitions) {
        if (def.kind === graphql_1.Kind.DIRECTIVE_DEFINITION) {
            const argsNodes = def.arguments ?? [];
            directiveArgs.set(def.name.value, new Set(argsNodes.map((arg) => arg.name.value)));
        }
    }
    return {
        Directive(directiveNode) {
            const directiveName = directiveNode.name.value;
            const knownArgs = directiveArgs.get(directiveName);
            if (directiveNode.arguments && knownArgs) {
                for (const argNode of directiveNode.arguments) {
                    const argName = argNode.name.value;
                    if (!knownArgs.has(argName)) {
                        context.reportError(new graphql_1.GraphQLError(`Unknown argument "${argName}" on directive "@${directiveName}".`, {
                            nodes: argNode,
                            extensions: {
                                code: "INVALID_GRAPHQL",
                            },
                        }));
                    }
                }
            }
        },
    };
}
