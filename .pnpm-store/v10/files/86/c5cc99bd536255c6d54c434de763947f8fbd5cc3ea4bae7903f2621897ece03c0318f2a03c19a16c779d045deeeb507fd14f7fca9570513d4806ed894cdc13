"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoneSchemaDefinitionRule = LoneSchemaDefinitionRule;
const graphql_1 = require("graphql");
function LoneSchemaDefinitionRule(context) {
    let schemaDefinitionsCount = 0;
    return {
        SchemaDefinition() {
            if (schemaDefinitionsCount > 0) {
                context.reportError(new graphql_1.GraphQLError("Must provide only one schema definition.", {
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
            ++schemaDefinitionsCount;
        },
    };
}
