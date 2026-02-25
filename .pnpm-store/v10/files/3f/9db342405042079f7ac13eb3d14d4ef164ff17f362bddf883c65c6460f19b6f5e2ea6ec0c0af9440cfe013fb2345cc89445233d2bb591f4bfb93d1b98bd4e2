"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupergraphValidationContext = createSupergraphValidationContext;
function createSupergraphValidationContext(subgraphStates) {
    let reportedErrors = [];
    const subgraphNameToIdMap = {};
    for (const [id, state] of subgraphStates) {
        subgraphNameToIdMap[state.graph.name] = id;
    }
    return {
        subgraphStates,
        graphIdToName(id) {
            const found = subgraphStates.get(id);
            if (!found) {
                throw new Error(`Could not find subgraph with id ${id}`);
            }
            return found.graph.name;
        },
        graphNameToId(name) {
            const found = subgraphNameToIdMap[name];
            return found ?? null;
        },
        reportError(error) {
            reportedErrors.push(error);
        },
        collectReportedErrors() {
            const errors = reportedErrors;
            reportedErrors = [];
            return errors;
        },
    };
}
