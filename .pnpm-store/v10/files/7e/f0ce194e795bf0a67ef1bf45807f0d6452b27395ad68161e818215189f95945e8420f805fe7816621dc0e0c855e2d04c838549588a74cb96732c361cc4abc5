import { constantCase } from "constant-case";
import { moveSchemaAndDirectiveDefinitionsToTop } from "./graphql/helpers.js";
import { detectFederationVersion, } from "./specifications/federation.js";
import { cleanSubgraphStateFromFederationSpec, cleanSubgraphStateFromLinkSpec, createSubgraphStateBuilder, } from "./subgraph/state.js";
import { validateSubgraph as internal_validateSubgraph, validateSubgraphCore, } from "./subgraph/validation/validate-subgraph.js";
import { createSupergraphStateBuilder } from "./supergraph/state.js";
import { validateSupergraph } from "./supergraph/validation/validate-supergraph.js";
const numberAtStartRegex = /^\d/;
function startsWithNumber(value) {
    return numberAtStartRegex.test(value);
}
function buildGraphList(subgraphs) {
    const errors = [];
    const graphs = [];
    const names = new Set();
    const idCounter = new Map();
    for (const subgraph of subgraphs) {
        const name = String(subgraph.name);
        const nameStartsWithNumber = startsWithNumber(name);
        if (names.has(name)) {
            throw new Error(`A subgraph named ${name} already exists`);
        }
        const { url, typeDefs } = subgraph;
        names.add(name);
        let proposedId = constantCase(name.replace(/[^A-Z0-9]/gi, "_"), {
            stripRegexp: /[^A-Z0-9_]+/gi,
        });
        if (nameStartsWithNumber) {
            proposedId = "_" + proposedId + "_";
        }
        let count = idCounter.get(proposedId);
        if (typeof count === "number") {
            if (count === 1) {
                graphs.find((g) => g.id === proposedId).id += "_1";
            }
            graphs.push({
                name,
                id: proposedId + "_" + (count + 1),
                url,
                typeDefs: moveSchemaAndDirectiveDefinitionsToTop(typeDefs),
            });
            idCounter.set(proposedId, count + 1);
        }
        else {
            idCounter.set(proposedId, 1);
            graphs.push({
                name,
                id: proposedId,
                url,
                typeDefs: moveSchemaAndDirectiveDefinitionsToTop(typeDefs),
            });
        }
    }
    if (errors.length > 0) {
        return {
            success: false,
            errors,
        };
    }
    graphs.sort((a, b) => a.id.localeCompare(b.id));
    return {
        success: true,
        graphs,
    };
}
export function validateSubgraph(subgraph) {
    const subgraphs = [subgraph];
    const graphList = buildGraphList(subgraphs);
    if (!graphList.success) {
        return graphList.errors;
    }
    const corePerSubgraph = graphList.graphs.map((subgraph) => validateSubgraphCore(subgraph));
    const coreErrors = corePerSubgraph.map((core) => core.errors ?? []).flat(1);
    if (coreErrors.length > 0) {
        return coreErrors;
    }
    const detectedFederationSpec = new Map(graphList.graphs.map((graph) => [graph.id, detectFederationVersion(graph.typeDefs)]));
    const subgraphStateBuilders = new Map(graphList.graphs.map((graph, i) => [
        graph.id,
        createSubgraphStateBuilder(graph, graph.typeDefs, detectedFederationSpec.get(graph.id).version, corePerSubgraph[i].links ?? []),
    ]));
    const subgraphErrors = graphList.graphs
        .map((graph) => internal_validateSubgraph(graph, subgraphStateBuilders.get(graph.id), detectedFederationSpec.get(graph.id)))
        .flat(1);
    return subgraphErrors;
}
export function validate(subgraphs, __internal) {
    const graphList = buildGraphList(subgraphs);
    if (!graphList.success) {
        return {
            success: false,
            errors: graphList.errors,
        };
    }
    const corePerSubgraph = graphList.graphs.map((subgraph) => validateSubgraphCore(subgraph));
    const coreErrors = corePerSubgraph.map((core) => core.errors ?? []).flat(1);
    if (coreErrors.length > 0) {
        return {
            success: false,
            errors: coreErrors,
        };
    }
    const detectedFederationSpec = new Map(graphList.graphs.map((graph) => [graph.id, detectFederationVersion(graph.typeDefs)]));
    const subgraphStateBuilders = new Map(graphList.graphs.map((graph, i) => [
        graph.id,
        createSubgraphStateBuilder(graph, graph.typeDefs, detectedFederationSpec.get(graph.id).version, corePerSubgraph[i].links ?? []),
    ]));
    const subgraphErrors = graphList.graphs
        .map((graph) => internal_validateSubgraph(graph, subgraphStateBuilders.get(graph.id), detectedFederationSpec.get(graph.id), __internal))
        .flat(1);
    if (subgraphErrors.length > 0) {
        return {
            success: false,
            errors: subgraphErrors,
        };
    }
    const state = createSupergraphStateBuilder();
    const supergraphErrors = validateSupergraph(new Map(Array.from(subgraphStateBuilders.entries()).map(([id, builder]) => [
        id,
        cleanSubgraphStateFromFederationSpec(cleanSubgraphStateFromLinkSpec(builder.state)),
    ])), state, __internal);
    if (supergraphErrors.length > 0) {
        return {
            success: false,
            errors: supergraphErrors,
        };
    }
    const nodes = state.build();
    let maxFederationVersion = "v1.0";
    for (let [_, { version }] of detectedFederationSpec) {
        if (isVersionHigher(version, maxFederationVersion)) {
            maxFederationVersion = version;
        }
    }
    return {
        success: true,
        supergraph: nodes,
        links: state.links(),
        specs: state.getSupergraphState().specs,
        federationVersion: maxFederationVersion,
    };
}
function isVersionHigher(sourceVersion, targetVersion) {
    const sourceVersionParts = Number(sourceVersion.replace("v", ""));
    const targetVersionParts = Number(targetVersion.replace("v", ""));
    return sourceVersionParts > targetVersionParts;
}
