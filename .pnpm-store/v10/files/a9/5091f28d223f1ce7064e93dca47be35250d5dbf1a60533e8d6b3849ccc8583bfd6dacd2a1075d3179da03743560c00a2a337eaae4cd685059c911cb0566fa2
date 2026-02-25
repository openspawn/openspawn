"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvidedRequiredArgumentsOnDirectivesRule = ProvidedRequiredArgumentsOnDirectivesRule;
const graphql_1 = require("graphql");
const printer_js_1 = require("../../../graphql/printer.js");
function ProvidedRequiredArgumentsOnDirectivesRule(context) {
    const requiredArgsMap = Object.create(null);
    const astDefinitions = context.getDocument().definitions;
    for (const def of astDefinitions) {
        if (def.kind === graphql_1.Kind.DIRECTIVE_DEFINITION) {
            const argNodes = def.arguments ?? [];
            const requiredArgs = argNodes.filter(isRequiredArgumentNode);
            requiredArgsMap[def.name.value] = {};
            for (const requiredArg of requiredArgs) {
                requiredArgsMap[def.name.value][requiredArg.name.value] = requiredArg;
            }
        }
    }
    return {
        Directive: {
            leave(directiveNode) {
                const directiveName = directiveNode.name.value;
                const requiredArgs = requiredArgsMap[directiveName];
                if (requiredArgs) {
                    const argNodes = directiveNode.arguments ?? [];
                    const argNodeMap = new Set(argNodes.map((arg) => arg.name.value));
                    for (const [argName, argDef] of Object.entries(requiredArgs)) {
                        if (!argNodeMap.has(argName)) {
                            const argType = (0, printer_js_1.print)(argDef.type);
                            context.reportError(new graphql_1.GraphQLError(`Directive "@${directiveName}" argument "${argName}" of type "${argType}" is required, but it was not provided.`, {
                                nodes: directiveNode,
                                extensions: {
                                    code: "INVALID_GRAPHQL",
                                },
                            }));
                        }
                    }
                }
            },
        },
    };
}
function isRequiredArgumentNode(arg) {
    return arg.type.kind === graphql_1.Kind.NON_NULL_TYPE && arg.defaultValue == null;
}
