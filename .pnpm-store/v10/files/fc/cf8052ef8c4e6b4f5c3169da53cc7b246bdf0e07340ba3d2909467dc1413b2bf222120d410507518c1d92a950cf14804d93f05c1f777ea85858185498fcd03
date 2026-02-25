"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Supergraph = void 0;
const logger_js_1 = require("../../../../utils/logger.js");
const constants_js_1 = require("./constants.js");
const graph_js_1 = require("./graph.js");
const move_validator_js_1 = require("./move-validator.js");
const selection_js_1 = require("./selection.js");
const walker_js_1 = require("./walker.js");
class Supergraph {
    supergraph;
    mergedGraph;
    selectionResolver;
    moveRequirementChecker;
    logger = new logger_js_1.Logger("Supergraph", new logger_js_1.LoggerContext());
    constructor(supergraphState) {
        this.selectionResolver = new selection_js_1.SelectionResolver(supergraphState);
        this.supergraph = new graph_js_1.Graph(this.logger, constants_js_1.SUPERGRAPH_ID, "supergraph", supergraphState, this.selectionResolver, true);
        this.mergedGraph = new graph_js_1.Graph(this.logger, constants_js_1.MERGEDGRAPH_ID, "merged", supergraphState, this.selectionResolver);
        for (const [id, subgraphState] of supergraphState.subgraphs) {
            this.mergedGraph.addSubgraph(new graph_js_1.Graph(this.logger, id, subgraphState.graph.name, supergraphState, this.selectionResolver, false)
                .addFromRoots()
                .addFromEntities()
                .addUnreachableTypes());
        }
        this.mergedGraph.joinSubgraphs();
        this.mergedGraph.addOverriddenFields();
        this.supergraph
            .addFromRoots()
            .addOverriddenFields()
            .addInterfaceObjectFields();
        this.moveRequirementChecker = new move_validator_js_1.MoveValidator(this.logger, this.mergedGraph);
    }
    validate() {
        return new walker_js_1.Walker(this.logger, this.moveRequirementChecker, this.supergraph, this.mergedGraph).walk("dfs");
    }
    validateOperation(operation, steps) {
        return new walker_js_1.Walker(this.logger, this.moveRequirementChecker, this.supergraph, this.mergedGraph).walkTrail(operation, steps);
    }
}
exports.Supergraph = Supergraph;
