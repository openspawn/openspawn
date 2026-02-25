import type { Logger } from "../../../../utils/logger.cjs";
import { Edge } from "./edge.cjs";
import { LazyErrors, SatisfiabilityError } from "./errors.cjs";
import type { Graph } from "./graph.cjs";
import { OverrideLabels } from "./helpers.cjs";
import type { MoveValidator } from "./move-validator.cjs";
import type { OperationPath } from "./operation-path.cjs";
import { Selection } from "./selection.cjs";
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