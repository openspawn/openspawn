"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Walker = exports.WalkTracker = void 0;
const graphql_1 = require("graphql");
const edge_js_1 = require("./edge.js");
const errors_js_1 = require("./errors.js");
const finder_js_1 = require("./finder.js");
const helpers_js_1 = require("./helpers.js");
const operation_path_js_1 = require("./operation-path.js");
class WalkTracker {
    superPath;
    paths;
    labelValues;
    errors = new errors_js_1.LazyErrors();
    constructor(superPath, paths, labelValues) {
        this.superPath = superPath;
        this.paths = paths;
        this.labelValues = labelValues;
    }
    move(edge) {
        if ((0, edge_js_1.isFieldEdge)(edge) || (0, edge_js_1.isAbstractEdge)(edge)) {
            if ((0, edge_js_1.isFieldEdge)(edge) && edge.move.override?.label) {
                return new WalkTracker(this.superPath.clone().move(edge), [], this.labelValues
                    .clone()
                    .set(edge.move.override.label, edge.move.override.value));
            }
            return new WalkTracker(this.superPath.clone().move(edge), [], this.labelValues.clone());
        }
        throw new Error("Expected edge to be FieldMove or AbstractMove");
    }
    addPath(path) {
        this.paths.push(path);
        this.errors = new errors_js_1.LazyErrors();
    }
    addError(errors) {
        this.errors.add(errors);
    }
    isPossible() {
        return this.paths.length > 0;
    }
    givesEmptyResult() {
        const lastEdge = this.superPath.edge();
        return (this.paths.length === 0 &&
            this.errors.isEmpty() &&
            !!lastEdge &&
            (0, edge_js_1.isAbstractEdge)(lastEdge));
    }
    isEdgeVisited(edge) {
        return this.superPath.isVisitedEdge(edge);
    }
    listErrors() {
        return this.errors
            .toArray()
            .filter((error, i, all) => all.findIndex((e) => e.toString() === error.toString()) === i)
            .filter((error) => {
            if (error.kind !== "KEY") {
                return true;
            }
            const steps = this.superPath.steps();
            const lastStep = steps[steps.length - 1];
            if (!lastStep || lastStep.typeName !== error.typeName) {
                return true;
            }
            return true;
        });
    }
}
exports.WalkTracker = WalkTracker;
const defaultIsEdgeIgnored = () => false;
class Walker {
    moveChecker;
    supergraph;
    mergedGraph;
    logger;
    pathFinder;
    constructor(logger, moveChecker, supergraph, mergedGraph) {
        this.moveChecker = moveChecker;
        this.supergraph = supergraph;
        this.mergedGraph = mergedGraph;
        this.logger = logger.create("Walker");
        this.pathFinder = new finder_js_1.PathFinder(this.logger, this.mergedGraph, this.moveChecker);
    }
    walkTrail(operationType, steps) {
        if (steps.length === 0) {
            throw new Error("Expected at least one step");
        }
        const rootNode = this.supergraph.nodeOf(operationType === graphql_1.OperationTypeNode.QUERY
            ? "Query"
            : operationType === graphql_1.OperationTypeNode.MUTATION
                ? "Mutation"
                : "Subscription", false);
        if (!rootNode) {
            throw new Error(`Expected root node for operation type ${operationType}`);
        }
        let state = new WalkTracker(new operation_path_js_1.OperationPath(rootNode), this.mergedGraph
            .nodesOf(rootNode.typeName, false)
            .map((n) => new operation_path_js_1.OperationPath(n)), new helpers_js_1.OverrideLabels());
        for (const step of steps) {
            const stepId = "fieldName" in step && step.fieldName
                ? `${step.typeName}.${step.fieldName}`
                : step.typeName;
            const isFieldStep = "fieldName" in step;
            const isEdgeIgnored = (edge) => {
                if (isFieldStep) {
                    return !(0, edge_js_1.isFieldEdge)(edge) || edge.move.fieldName !== step.fieldName;
                }
                return true;
            };
            let called = 0;
            let unreachable = false;
            let emptyObjectResult = false;
            this.nextStep(state, state.superPath.tail() ?? state.superPath.rootNode(), (nextState, superEdge) => {
                if (called++ > 1) {
                    throw new Error("Expected nextStep to be called only once");
                }
                state = nextState;
                if (nextState.isPossible()) {
                    if (this.logger.isEnabled) {
                        for (const path of nextState.paths) {
                            this.logger.log(() => path.toString());
                        }
                    }
                    this.logger.groupEnd(() => "Advanced to " +
                        superEdge +
                        " with " +
                        nextState.paths.length +
                        " paths");
                }
                else if (nextState.givesEmptyResult()) {
                    emptyObjectResult = true;
                    this.logger.groupEnd(() => "Federation will resolve an empty object for " + superEdge);
                }
                else {
                    unreachable = true;
                    this.logger.log(() => "Dead end", "🚨 ");
                    if (this.logger.isEnabled) {
                        for (const path of state.paths) {
                            this.logger.log(() => path.toString());
                        }
                    }
                    this.logger.groupEnd(() => "Unreachable path " + nextState.superPath.toString());
                }
            }, isEdgeIgnored);
            if (unreachable) {
                break;
            }
            if (emptyObjectResult) {
                break;
            }
        }
        return state;
    }
    walk(method = "bfs") {
        if (method === "dfs") {
            return this.dfs();
        }
        return this.bfs();
    }
    nextStep(state, superTail, next, isEdgeIgnored = defaultIsEdgeIgnored) {
        const graphsLeadingToNode = Array.from(new Set(state.paths.map((p) => {
            const edge = p.edge();
            const tail = p.tail() ?? p.rootNode();
            const tailGraphName = tail.graphName;
            if (edge && (0, edge_js_1.isFieldEdge)(edge) && edge.move.provides) {
                return `${tailGraphName}#provides`;
            }
            return tailGraphName;
        })));
        if (superTail.isGraphComboVisited(graphsLeadingToNode, state.labelValues)) {
            this.logger.log(() => "Node already visited: " + superTail);
            return;
        }
        superTail.setGraphComboAsVisited(graphsLeadingToNode);
        const superEdges = this.supergraph.edgesOfHead(superTail);
        for (const superEdge of superEdges) {
            if (isEdgeIgnored(superEdge)) {
                continue;
            }
            this.logger.group(() => "Attempt to advance to " +
                superEdge +
                " (" +
                state.paths.length +
                " paths)");
            if (state.isEdgeVisited(superEdge)) {
                this.logger.groupEnd(() => "Edge already visited: " + superEdge);
                continue;
            }
            if (!((0, edge_js_1.isFieldEdge)(superEdge) || (0, edge_js_1.isAbstractEdge)(superEdge))) {
                throw new Error("Expected edge to have a FieldMove or AbstractMove");
            }
            if ((0, edge_js_1.isFieldEdge)(superEdge) && superEdge.move.override?.label) {
                const labelValue = state.labelValues.get(superEdge.move.override.label);
                if (typeof labelValue === "boolean" &&
                    labelValue !== superEdge.move.override.value) {
                    this.logger.groupEnd(() => "Different label value. Skipping " + superEdge);
                    continue;
                }
            }
            const nextState = state.move(superEdge);
            const shortestPathPerTail = new Map();
            const superEdgeIsField = (0, edge_js_1.isFieldEdge)(superEdge);
            const id = superEdgeIsField
                ? `${superEdge.move.typeName}.${superEdge.move.fieldName}`
                : `... on ${superEdge.tail.typeName}`;
            for (const path of state.paths) {
                this.logger.group(() => "Advance path: " + path.toString());
                const directPathsResult = this.pathFinder.findDirectPaths(path, superEdgeIsField ? superEdge.move.typeName : superEdge.tail.typeName, superEdgeIsField ? superEdge.move.fieldName : null, [], nextState.labelValues);
                if (directPathsResult.success && directPathsResult.paths.length === 0) {
                    this.logger.groupEnd(() => "Abstract type");
                    continue;
                }
                if (directPathsResult.success) {
                    setShortestPath(shortestPathPerTail, directPathsResult.paths);
                }
                else {
                    nextState.addError(directPathsResult.errors);
                }
                if (directPathsResult.success && superEdge.tail.isLeaf) {
                    this.logger.groupEnd(() => "Reached leaf node, no need to find indirect paths");
                    break;
                }
                const indirectPathsResult = this.pathFinder.findIndirectPaths(path, superEdgeIsField ? superEdge.move.typeName : superEdge.tail.typeName, superEdgeIsField ? superEdge.move.fieldName : null, [], [], [], nextState.labelValues);
                if (indirectPathsResult.success) {
                    setShortestPath(shortestPathPerTail, indirectPathsResult.paths);
                }
                else {
                    nextState.addError(indirectPathsResult.errors);
                }
                this.logger.groupEnd(() => directPathsResult.success || indirectPathsResult.success
                    ? "Can advance to " + id
                    : "Cannot advance to " + id);
            }
            for (const shortestPathByTail of shortestPathPerTail.values()) {
                nextState.addPath(shortestPathByTail);
            }
            next(nextState, superEdge);
        }
    }
    dfs() {
        const unreachable = [];
        const rootNodes = ["Query", "Mutation", "Subscription"]
            .map((name) => this.supergraph.nodeOf(name, false))
            .filter((node) => !!node);
        const overrideLabels = new helpers_js_1.OverrideLabels();
        for (const rootNode of rootNodes) {
            this._dfs(rootNode, new WalkTracker(new operation_path_js_1.OperationPath(rootNode), this.mergedGraph
                .nodesOf(rootNode.typeName, false)
                .map((n) => new operation_path_js_1.OperationPath(n)), overrideLabels), unreachable);
        }
        return unreachable;
    }
    _dfs(superTail, state, unreachable) {
        if (superTail.isLeaf) {
            return;
        }
        this.nextStep(state, superTail, (nextState, superEdge) => {
            if (nextState.isPossible()) {
                if (this.logger.isEnabled) {
                    for (const path of nextState.paths) {
                        this.logger.log(() => path.toString());
                    }
                }
                this.logger.groupEnd(() => "Advanced to " +
                    superEdge +
                    " with " +
                    nextState.paths.length +
                    " paths");
                this._dfs(superEdge.tail, nextState, unreachable);
            }
            else if (nextState.givesEmptyResult()) {
                this.logger.groupEnd(() => "Federation will resolve an empty object for " + superEdge);
            }
            else {
                unreachable.push(nextState);
                this.logger.log(() => "Dead end", "🚨 ");
                if (this.logger.isEnabled) {
                    for (const path of state.paths) {
                        this.logger.log(() => path.toString());
                    }
                }
                this.logger.groupEnd(() => "Unreachable path " + nextState.superPath.toString());
            }
        });
    }
    bfs() {
        const overrideLabels = new helpers_js_1.OverrideLabels();
        const unreachable = [];
        const queue = [];
        for (const name of ["Query", "Mutation", "Subscription"]) {
            const rootNode = this.supergraph.nodeOf(name, false);
            if (!rootNode) {
                continue;
            }
            queue.push(new WalkTracker(new operation_path_js_1.OperationPath(rootNode), this.mergedGraph
                .nodesOf(rootNode.typeName, false)
                .map((n) => new operation_path_js_1.OperationPath(n)), overrideLabels));
        }
        while (queue.length > 0) {
            const state = queue.pop();
            if (!state) {
                throw new Error("Unexpected end of queue");
            }
            const superTail = state.superPath.tail() ?? state.superPath.rootNode();
            if (superTail.isLeaf) {
                continue;
            }
            this.nextStep(state, superTail, (nextState, superEdge) => {
                if (nextState.isPossible()) {
                    if (this.logger.isEnabled) {
                        for (const path of nextState.paths) {
                            this.logger.log(() => path.toString());
                        }
                    }
                    this.logger.groupEnd(() => "Advanced to " +
                        superEdge +
                        " with " +
                        nextState.paths.length +
                        " paths");
                    queue.push(nextState);
                }
                else if (nextState.givesEmptyResult()) {
                    this.logger.groupEnd(() => "Federation will resolve an empty object for " + superEdge);
                }
                else {
                    unreachable.push(nextState);
                    this.logger.log(() => "Dead end", "🚨 ");
                    if (this.logger.isEnabled) {
                        for (const path of state.paths) {
                            this.logger.log(() => path.toString());
                        }
                    }
                    this.logger.groupEnd(() => "Unreachable path " + nextState.superPath.toString());
                }
            });
        }
        return unreachable;
    }
}
exports.Walker = Walker;
function setShortestPath(shortestPathPerTail, paths) {
    for (const path of paths) {
        const tail = path.tail() ?? path.rootNode();
        const shortestByTail = shortestPathPerTail.get(tail);
        if (!shortestByTail || shortestByTail.depth() > path.depth()) {
            shortestPathPerTail.set(tail, path);
        }
    }
}
