"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkImportNameMismatchRule = LinkImportNameMismatchRule;
const graphql_1 = require("graphql");
const format_js_1 = require("../../../utils/format.js");
function LinkImportNameMismatchRule(context) {
    const namesToSubgraphs = new Map();
    const namesToCheck = ["@cost", "@listSize"];
    for (const [subgraphId, subgraphState] of context.subgraphStates) {
        for (const imp of subgraphState.federation.imports) {
            if (!namesToCheck.includes(imp.name)) {
                continue;
            }
            let existing = namesToSubgraphs.get(imp.name);
            if (!existing) {
                namesToSubgraphs.set(imp.name, new Map());
                existing = namesToSubgraphs.get(imp.name);
            }
            const name = imp.alias ?? imp.name;
            let existingName = existing.get(name);
            if (!Array.isArray(existingName)) {
                existing.set(name, []);
                existingName = existing.get(name);
            }
            existingName.push(subgraphId);
        }
    }
    for (const [originalName, aliases] of namesToSubgraphs) {
        if (aliases.size <= 1) {
            continue;
        }
        context.reportError(new graphql_1.GraphQLError(`The import name "${originalName}" is imported with mismatched name between subgraphs: it is imported as ` +
            (0, format_js_1.andList)(Array.from(aliases).map(([name, subgraphIds]) => ` "${name}" in subgraph${subgraphIds.length > 1 ? "s" : ""} ${(0, format_js_1.andList)(subgraphIds.map(context.graphIdToName), false, '"')}`)), {
            extensions: {
                code: "LINK_IMPORT_NAME_MISMATCH",
            },
        }));
    }
}
