import type { Logger } from "../../../../utils/logger.js";
import { Edge } from "./edge.js";
import { LazyErrors, SatisfiabilityError } from "./errors.js";
import type { Graph } from "./graph.js";
import { OverrideLabels } from "./helpers.js";
import type { MoveValidator } from "./move-validator.js";
import type { OperationPath } from "./operation-path.js";
import { Selection } from "./selection.js";
export declare function concatIfNotExistsString(list: string[], item: string): string[];
export declare function concatIfNotExistsFields(list: Selection[], item: Selection): Selection[];
type PathFinderResult = {
    success: true;
    paths: OperationPath[];
    errors: undefined;
} | {
    success: false;
    paths: undefined;
    errors: LazyErrors<SatisfiabilityError>;
};
export declare class PathFinder {
    private logger;
    private graph;
    private moveValidator;
    constructor(logger: Logger, graph: Graph, moveValidator: MoveValidator);
    findDirectPaths(path: OperationPath, typeName: string, fieldName: string | null, visitedEdges: Edge[], labelValues: OverrideLabels): PathFinderResult;
    private findFieldIndirectly;
    private findTypeIndirectly;
    findIndirectPaths(path: OperationPath, typeName: string, fieldName: string | null, visitedEdges: Edge[], visitedGraphs: string[], visitedFields: Selection[], labelValues: OverrideLabels): PathFinderResult;
}
export {};
//# sourceMappingURL=finder.d.ts.map