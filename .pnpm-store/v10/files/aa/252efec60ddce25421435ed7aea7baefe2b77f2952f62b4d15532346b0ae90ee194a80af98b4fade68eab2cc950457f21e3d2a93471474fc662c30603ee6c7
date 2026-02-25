import type { Logger } from "../../../../utils/logger.cjs";
import { Edge } from "./edge.cjs";
import { SatisfiabilityError } from "./errors.cjs";
import type { Graph } from "./graph.cjs";
import { OverrideLabels, type Lazy } from "./helpers.cjs";
import { OperationPath } from "./operation-path.cjs";
import type { Selection } from "./selection.cjs";
export declare class MoveValidator {
    private supergraph;
    private logger;
    private pathFinder;
    constructor(logger: Logger, supergraph: Graph);
    private canResolveSelectionSet;
    private validateFragmentRequirement;
    private validateFieldRequirement;
    private validateRequirement;
    isExternal(edge: Edge): boolean;
    private canAccessFieldWithOverride;
    isEdgeResolvable(edge: Edge, path: OperationPath, visitedEdges: Edge[], visitedGraphs: string[], visitedFields: Selection[], labelValues: OverrideLabels): {
        success: true;
        error: undefined;
    } | {
        success: false;
        error: Lazy<SatisfiabilityError>;
    };
}
//# sourceMappingURL=move-validator.d.ts.map