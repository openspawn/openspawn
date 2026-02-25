"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalTypeMismatchRule = ExternalTypeMismatchRule;
const graphql_1 = require("graphql");
const format_js_1 = require("../../../utils/format.js");
const object_type_js_1 = require("../../composition/object-type.js");
function ExternalTypeMismatchRule(context) {
    return {
        ObjectTypeField(objectTypeState, fieldState) {
            if (fieldState.usedAsKey) {
                return;
            }
            const groupByType = new Map();
            const graphsWithEqualType = [];
            for (const [graphId, field] of fieldState.byGraph) {
                const graphVersion = context.subgraphStates.get(graphId).federation.version;
                const isExternal = graphVersion === "v1.0"
                    ? field.external &&
                        (0, object_type_js_1.isRealExtension)(objectTypeState.byGraph.get(graphId), graphVersion)
                    : field.external;
                if (!isExternal) {
                    graphsWithEqualType.push(graphId);
                    continue;
                }
                if (field.type === fieldState.type) {
                    graphsWithEqualType.push(graphId);
                    continue;
                }
                const existing = groupByType.get(field.type);
                if (existing) {
                    existing.push(graphId);
                }
                else {
                    groupByType.set(field.type, [graphId]);
                }
            }
            if (groupByType.size && graphsWithEqualType.length) {
                const groups = Array.from(groupByType.entries()).map(([type, graphs]) => {
                    const plural = graphs.length > 1 ? "s" : "";
                    return `type "${type}" in subgraph${plural} ${(0, format_js_1.andList)(graphs.map(context.graphIdToName), true, '"')}`;
                });
                const [first, ...rest] = groups;
                const nonExternal = `type "${fieldState.type}" in subgraph${graphsWithEqualType.length > 1 ? "s" : ""} ${(0, format_js_1.andList)(graphsWithEqualType.map(context.graphIdToName), true, '"')}`;
                context.reportError(new graphql_1.GraphQLError(`Type of field "${objectTypeState.name}.${fieldState.name}" is incompatible across subgraphs (where marked @external): it has ${nonExternal} but ${first}${rest.length ? ` and ${rest.join(" and ")}` : ""}`, {
                    extensions: {
                        code: "EXTERNAL_TYPE_MISMATCH",
                    },
                }));
            }
        },
    };
}
