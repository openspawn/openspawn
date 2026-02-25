import { OperationTypeNode } from "graphql";
import type { Logger } from "../../../../utils/logger.js";
import { type Edge } from "./edge.js";
import { LazyErrors, SatisfiabilityError } from "./errors.js";
import type { Graph } from "./graph.js";
import { OverrideLabels } from "./helpers.js";
import type { MoveValidator } from "./move-validator.js";
import { OperationPath, type Step } from "./operation-path.js";
export declare class WalkTracker {
    superPath: OperationPath;
    paths: OperationPath[];
    labelValues: OverrideLabels;
    private errors;
    constructor(superPath: OperationPath, paths: OperationPath[], labelValues: OverrideLabels);
    move(edge: Edge): WalkTracker;
    addPath(path: OperationPath): void;
    addError(errors: LazyErrors<SatisfiabilityError>): void;
    isPossible(): boolean;
    givesEmptyResult(): boolean;
    isEdgeVisited(edge: Edge): boolean;
    listErrors(): SatisfiabilityError[];
}
export declare class Walker {
    private moveChecker;
    private supergraph;
    private mergedGraph;
    private logger;
    private pathFinder;
    constructor(logger: Logger, moveChecker: MoveValidator, supergraph: Graph, mergedGraph: Graph);
    walkTrail(operationType: OperationTypeNode, steps: Step[]): WalkTracker;
    walk(method?: "bfs" | "dfs"): WalkTracker[];
    private nextStep;
    private dfs;
    private _dfs;
    private bfs;
}
//# sourceMappingURL=walker.d.ts.map