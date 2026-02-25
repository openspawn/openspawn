import type { Logger } from "../../../../utils/logger.js";
import { Edge } from "./edge.js";
import { SatisfiabilityError } from "./errors.js";
import type { Graph } from "./graph.js";
import { OverrideLabels, type Lazy } from "./helpers.js";
import { OperationPath } from "./operation-path.js";
import type { Selection } from "./selection.js";
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