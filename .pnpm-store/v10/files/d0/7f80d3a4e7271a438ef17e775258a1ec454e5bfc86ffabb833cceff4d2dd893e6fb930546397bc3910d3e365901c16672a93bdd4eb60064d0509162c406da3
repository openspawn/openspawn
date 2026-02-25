import { isAbstractEdge, isEntityEdge, isFieldEdge } from "./edge.js";
import { LazyErrors, SatisfiabilityError } from "./errors.js";
import { concatIfNotExistsFields, concatIfNotExistsString, PathFinder, } from "./finder.js";
import { lazy } from "./helpers.js";
function isFragmentRequirement(requirement) {
    return requirement.selection.kind === "fragment";
}
function isFieldRequirement(requirement) {
    return requirement.selection.kind === "field";
}
export class MoveValidator {
    supergraph;
    logger;
    pathFinder;
    constructor(logger, supergraph) {
        this.supergraph = supergraph;
        this.logger = logger.create("MoveValidator");
        this.pathFinder = new PathFinder(this.logger, supergraph, this);
    }
    canResolveSelectionSet(selectionSet, path, visitedEdges, visitedGraphs, visitedFields, labelValues) {
        const requirements = [];
        for (const selection of selectionSet) {
            requirements.unshift({
                selection,
                paths: [path.clone()],
            });
        }
        while (requirements.length > 0) {
            const requirement = requirements.pop();
            if (!requirement) {
                break;
            }
            const result = this.validateRequirement(requirement, visitedEdges, visitedGraphs, visitedFields, labelValues);
            if (result.success === false) {
                return result;
            }
            for (const innerRequirement of result.requirements) {
                requirements.unshift(innerRequirement);
            }
        }
        return {
            success: true,
            errors: undefined,
        };
    }
    validateFragmentRequirement(requirement, visitedEdges, visitedGraphs, visitedFields, labelValues) {
        this.logger.log(() => "Validating: ... on " + requirement.selection.typeName);
        const nextPaths = [];
        const errors = new LazyErrors();
        if (requirement.paths[0].tail()?.typeName === requirement.selection.typeName) {
            return {
                success: true,
                requirements: requirement.selection.selectionSet.map((selection) => ({
                    selection,
                    paths: requirement.paths,
                })),
            };
        }
        for (const path of requirement.paths) {
            const directPathsResult = this.pathFinder.findDirectPaths(path, requirement.selection.typeName, null, visitedEdges, labelValues);
            if (directPathsResult.success) {
                if (this.logger.isEnabled) {
                    this.logger.log(() => "Possible direct paths:");
                    for (const path of directPathsResult.paths) {
                        this.logger.log(() => " " + path.toString());
                    }
                }
                nextPaths.push(...directPathsResult.paths);
            }
            else {
                errors.add(directPathsResult.errors);
            }
        }
        for (const path of requirement.paths) {
            const indirectPathsResult = this.pathFinder.findIndirectPaths(path, requirement.selection.typeName, null, visitedEdges, visitedGraphs, visitedFields, labelValues);
            if (indirectPathsResult.success) {
                if (this.logger.isEnabled) {
                    this.logger.log(() => "Possible indirect paths:");
                    for (const path of indirectPathsResult.paths) {
                        this.logger.log(() => " " + path.toString());
                    }
                }
                nextPaths.push(...indirectPathsResult.paths);
            }
            else {
                errors.add(indirectPathsResult.errors);
            }
        }
        if (nextPaths.length === 0) {
            if (this.logger.isEnabled) {
                this.logger.log(() => "Could not resolve from:");
                for (const path of requirement.paths) {
                    this.logger.log(() => " " + path.toString());
                }
            }
            return {
                success: false,
                errors,
            };
        }
        if (!requirement.selection.selectionSet ||
            requirement.selection.selectionSet.length === 0) {
            return {
                success: true,
                requirements: [],
            };
        }
        return {
            success: true,
            requirements: requirement.selection.selectionSet.map((selection) => ({
                selection,
                paths: nextPaths.slice(),
            })),
        };
    }
    validateFieldRequirement(requirement, visitedEdges, visitedGraphs, visitedFields, labelValues) {
        const { fieldName, typeName } = requirement.selection;
        this.logger.log(() => "Validating: " + typeName + "." + fieldName);
        const nextPaths = [];
        const errors = new LazyErrors();
        for (const path of requirement.paths) {
            const directPathsResult = this.pathFinder.findDirectPaths(path, requirement.selection.typeName, requirement.selection.fieldName, visitedEdges, labelValues);
            if (directPathsResult.success) {
                if (this.logger.isEnabled) {
                    this.logger.log(() => "Possible direct paths:");
                    for (const path of directPathsResult.paths) {
                        this.logger.log(() => " " + path.toString());
                    }
                }
                nextPaths.push(...directPathsResult.paths);
            }
            else {
                errors.add(directPathsResult.errors);
            }
        }
        for (const path of requirement.paths) {
            const indirectPathsResult = this.pathFinder.findIndirectPaths(path, requirement.selection.typeName, requirement.selection.fieldName, visitedEdges, visitedGraphs, visitedFields, labelValues);
            if (indirectPathsResult.success) {
                if (this.logger.isEnabled) {
                    this.logger.log(() => "Possible indirect paths:");
                    for (const path of indirectPathsResult.paths) {
                        this.logger.log(() => " " + path.toString());
                    }
                }
                nextPaths.push(...indirectPathsResult.paths);
            }
            else {
                errors.add(indirectPathsResult.errors);
            }
        }
        if (nextPaths.length === 0) {
            this.logger.log(() => `Failed to resolve field ${typeName}.${fieldName} from:`);
            if (this.logger.isEnabled) {
                for (const path of requirement.paths) {
                    this.logger.log(() => ` ` + path);
                }
            }
            return {
                success: false,
                errors,
            };
        }
        if (!requirement.selection.selectionSet ||
            requirement.selection.selectionSet.length === 0) {
            return {
                success: true,
                requirements: [],
            };
        }
        return {
            success: true,
            requirements: requirement.selection.selectionSet.map((selection) => ({
                selection,
                paths: nextPaths.slice(),
            })),
        };
    }
    validateRequirement(requirement, visitedEdges, visitedGraphs, visitedFields, labelValues) {
        if (isFragmentRequirement(requirement)) {
            return this.validateFragmentRequirement(requirement, visitedEdges, visitedGraphs, visitedFields, labelValues);
        }
        if (isFieldRequirement(requirement)) {
            return this.validateFieldRequirement(requirement, visitedEdges, visitedGraphs, visitedFields, labelValues);
        }
        throw new Error(`Unsupported requirement: ${requirement.selection.kind}`);
    }
    isExternal(edge) {
        if (!isFieldEdge(edge)) {
            return false;
        }
        if (!isFieldEdge(edge) ||
            edge.move.provided ||
            !edge.head.typeState ||
            edge.head.typeState.kind !== "object") {
            return false;
        }
        const fieldState = edge.head.typeState.fields.get(edge.move.fieldName);
        if (!fieldState) {
            return false;
        }
        const objectTypeStateInGraph = edge.head.typeState.byGraph.get(edge.head.graphId);
        const fieldStateInGraph = fieldState.byGraph.get(edge.head.graphId);
        if (!fieldStateInGraph || !objectTypeStateInGraph) {
            return false;
        }
        if (!fieldStateInGraph.external) {
            return false;
        }
        if (fieldStateInGraph.version === "v1.0" &&
            objectTypeStateInGraph.extension &&
            fieldState.usedAsKey) {
            return false;
        }
        if (!fieldStateInGraph.usedAsKey) {
            return true;
        }
        if (objectTypeStateInGraph.extension) {
            return false;
        }
        return true;
    }
    canAccessFieldWithOverride(edge, overrideLabels) {
        if (!edge.move.override) {
            return true;
        }
        if (!edge.move.override.label) {
            return edge.move.override.value;
        }
        const value = overrideLabels.get(edge.move.override.label);
        if (typeof value !== "boolean") {
            return false;
        }
        return edge.move.override.value === value;
    }
    isEdgeResolvable(edge, path, visitedEdges, visitedGraphs, visitedFields, labelValues) {
        this.logger.group(() => "Checking resolvability of " + edge);
        this.logger.log(() => "Visited graphs: " + visitedGraphs.join(","));
        const resolvability = edge.getResolvability(concatIfNotExistsString(visitedGraphs, edge.tail.graphName), labelValues);
        if (resolvability) {
            this.logger.groupEnd(() => resolvability.success
                ? `Can move to ${edge}`
                : `Cannot move to ${edge} (already visited: ${resolvability.error.get().kind})`);
            return resolvability;
        }
        if (isFieldEdge(edge)) {
            if (!this.canAccessFieldWithOverride(edge, labelValues)) {
                this.logger.groupEnd(() => "Cannot move to " +
                    edge +
                    " because it requirement of the override is not met");
                return edge.setResolvable(false, visitedGraphs, labelValues, lazy(() => SatisfiabilityError.forMissingField(edge.tail.graphName, edge.move.typeName, edge.move.fieldName)));
            }
            if (this.isExternal(edge)) {
                this.logger.groupEnd(() => "Cannot move to " +
                    edge +
                    " because it is external and cross-graph");
                return edge.setResolvable(false, visitedGraphs, labelValues, lazy(() => SatisfiabilityError.forExternal(edge.head.graphName, edge.move.typeName, edge.move.fieldName)));
            }
            if (edge.move.requires) {
                this.logger.log(() => "Detected @requires");
                const newVisitedGraphs = edge.isCrossGraphEdge()
                    ? concatIfNotExistsString(visitedGraphs, edge.tail.graphName)
                    : visitedGraphs;
                const newVisitedFields = concatIfNotExistsFields(visitedFields, edge.move.requires);
                this.logger.log(() => "Visited graphs: " + newVisitedGraphs.join(","));
                if (this.canResolveSelectionSet(edge.move.requires.selectionSet, path, visitedEdges.concat(edge), newVisitedGraphs, newVisitedFields, labelValues).success) {
                    this.logger.groupEnd(() => "Can move to " + edge);
                    return edge.setResolvable(true, newVisitedGraphs, labelValues);
                }
                this.logger.groupEnd(() => "Cannot move to " + edge + " because @require is not resolvable");
                return {
                    success: false,
                    error: lazy(() => SatisfiabilityError.forRequire(edge.head.graphName, edge.move.typeName, edge.move.fieldName)),
                };
            }
            this.logger.groupEnd(() => "Can move to " + edge);
            return edge.setResolvable(true, visitedGraphs, labelValues);
        }
        if (!isEntityEdge(edge) && !isAbstractEdge(edge)) {
            throw new Error("Expected edge to be entity or abstract");
        }
        if (!edge.move.keyFields) {
            this.logger.groupEnd(() => "Can move to " + edge);
            return edge.setResolvable(true, visitedGraphs, labelValues);
        }
        const newVisitedGraphs = concatIfNotExistsString(visitedGraphs, edge.tail.graphName);
        const newVisitedFields = concatIfNotExistsFields(visitedFields, edge.move.keyFields);
        const keyFields = edge.move.keyFields;
        this.logger.log(() => "Detected @key");
        this.logger.log(() => "Visited graphs: " + newVisitedGraphs.join(","));
        const resolvable = this.canResolveSelectionSet(keyFields.selectionSet, path, visitedEdges.concat(edge), newVisitedGraphs, newVisitedFields, labelValues).success;
        if (resolvable) {
            this.logger.groupEnd(() => "Can move to " + edge);
            return edge.setResolvable(true, newVisitedGraphs, labelValues);
        }
        this.logger.groupEnd(() => "Cannot move to " + edge + " because key fields are not resolvable");
        return edge.setResolvable(false, newVisitedGraphs, labelValues, lazy(() => SatisfiabilityError.forKey(edge.head.graphName, edge.tail.graphName, edge.head.typeName, keyFields.toString())));
    }
}
