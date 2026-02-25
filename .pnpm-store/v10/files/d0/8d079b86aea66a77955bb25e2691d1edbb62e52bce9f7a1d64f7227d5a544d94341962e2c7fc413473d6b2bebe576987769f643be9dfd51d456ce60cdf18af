import { isAbstractEdge, isEntityEdge, isFieldEdge } from "./edge.js";
import { LazyErrors, SatisfiabilityError } from "./errors.js";
import { lazy } from "./helpers.js";
export function concatIfNotExistsString(list, item) {
    if (list.includes(item)) {
        return list;
    }
    return list.concat(item);
}
export function concatIfNotExistsFields(list, item) {
    if (list.some((f) => f.equals(item))) {
        return list;
    }
    return list.concat(item);
}
export class PathFinder {
    logger;
    graph;
    moveValidator;
    constructor(logger, graph, moveValidator) {
        this.logger = logger;
        this.graph = graph;
        this.moveValidator = moveValidator;
    }
    findDirectPaths(path, typeName, fieldName, visitedEdges, labelValues) {
        const nextPaths = [];
        const errors = new LazyErrors();
        const tail = path.tail() ?? path.rootNode();
        const isFieldTarget = fieldName !== null;
        const id = isFieldTarget
            ? `${typeName}.${fieldName}`
            : `... on ${typeName}`;
        this.logger.group(() => "Direct paths to " + id + " from: " + tail);
        const edges = isFieldTarget
            ? this.graph.fieldEdgesOfHead(tail, fieldName)
            : this.graph.abstractEdgesOfHead(tail);
        this.logger.log(() => "Checking " + edges.length + " edges");
        let i = 0;
        for (const edge of edges) {
            this.logger.group(() => "Checking #" + i++ + " " + edge);
            if (nextPaths.some((p) => p.tail() === edge.tail)) {
                this.logger.groupEnd(() => "Already resolvable tail: " + edge);
                continue;
            }
            if (edge.isCrossGraphEdge()) {
                this.logger.groupEnd(() => "Cross graph edge: " + edge);
                continue;
            }
            if (visitedEdges.includes(edge)) {
                this.logger.groupEnd(() => "Already visited: " + edge);
                continue;
            }
            if (!isFieldTarget) {
                if (isAbstractEdge(edge) && edge.tail.typeName === typeName) {
                    this.logger.groupEnd(() => "Resolvable: " + edge);
                    const newPath = path.clone().move(edge);
                    nextPaths.push(newPath);
                    continue;
                }
            }
            if (isFieldTarget &&
                isFieldEdge(edge) &&
                edge.move.fieldName === fieldName) {
                const resolvable = this.moveValidator.isEdgeResolvable(edge, path, [], [], [], labelValues);
                if (!resolvable.success) {
                    errors.add(resolvable.error);
                    this.logger.groupEnd(() => "Not resolvable: " + edge);
                    continue;
                }
                this.logger.groupEnd(() => "Resolvable: " + edge);
                const newPath = path.clone().move(edge);
                nextPaths.push(newPath);
                continue;
            }
            this.logger.groupEnd(() => "Not matching");
        }
        this.logger.groupEnd(() => "Found " + nextPaths.length + " direct paths");
        if (nextPaths.length > 0) {
            return {
                success: true,
                paths: nextPaths,
                errors: undefined,
            };
        }
        if (!errors.isEmpty()) {
            return {
                success: false,
                errors,
                paths: undefined,
            };
        }
        if (!isFieldTarget) {
            if (tail.typeState?.kind === "interface" &&
                tail.typeState.hasInterfaceObject) {
                const typeStateInGraph = tail.typeState.byGraph.get(tail.graphId);
                if (typeStateInGraph?.isInterfaceObject) {
                    return {
                        success: false,
                        errors: new LazyErrors().add(lazy(() => SatisfiabilityError.forNoImplementation(tail.graphName, tail.typeName))),
                        paths: undefined,
                    };
                }
            }
            return {
                success: true,
                errors: undefined,
                paths: [],
            };
        }
        errors.add(lazy(() => SatisfiabilityError.forMissingField(tail.graphName, typeName, fieldName)));
        errors.add(lazy(() => {
            const errors = [];
            const typeNodes = this.graph.nodesOf(typeName);
            for (const typeNode of typeNodes) {
                const edges = this.graph.fieldEdgesOfHead(typeNode, fieldName);
                for (const edge of edges) {
                    if (isFieldEdge(edge) &&
                        edge.move.fieldName === fieldName &&
                        !this.moveValidator.isExternal(edge)) {
                        const typeStateInGraph = edge.head.typeState &&
                            edge.head.typeState.kind === "object" &&
                            edge.head.typeState.byGraph.get(edge.head.graphId);
                        const keys = typeStateInGraph
                            ? typeStateInGraph.keys.filter((key) => key.resolvable)
                            : [];
                        if (keys.length === 0) {
                            errors.push(SatisfiabilityError.forNoKey(tail.graphName, edge.tail.graphName, typeName, fieldName));
                        }
                    }
                }
            }
            return errors;
        }));
        return {
            success: false,
            errors,
            paths: undefined,
        };
    }
    findFieldIndirectly(path, typeName, fieldName, visitedEdges, visitedGraphs, visitedFields, labelValues, errors, finalPaths, queue, resolvedGraphs, edge) {
        if (!isEntityEdge(edge) && !isAbstractEdge(edge)) {
            this.logger.groupEnd(() => "Ignored");
            return;
        }
        if (resolvedGraphs.includes(edge.tail.graphName)) {
            this.logger.groupEnd(() => "Ignore: already resolved this graph");
            return;
        }
        if (edge.tail.typeState?.kind === "interface") {
            const fieldInEdge = edge.tail.typeState.fields
                .get(fieldName)
                ?.byGraph.get(edge.tail.graphId);
            if (fieldInEdge === undefined) {
                this.logger.groupEnd(() => "Ignore edge: tail type does not have this field");
                return;
            }
        }
        if (!!edge.move.keyFields &&
            visitedFields.some((f) => f.equals(edge.move.keyFields))) {
            this.logger.groupEnd(() => "Ignore: already visited fields");
            return;
        }
        if (isAbstractEdge(edge)) {
            const tailEdge = path.edge();
            if (tailEdge && isAbstractEdge(tailEdge) && !edge.move.keyFields) {
                this.logger.groupEnd(() => "Ignore: cannot do two abstract moves in a row");
                return;
            }
            if (!edge.isCrossGraphEdge()) {
                const newPath = path.clone().move(edge);
                queue.push([visitedGraphs, visitedFields, newPath]);
                this.logger.log(() => "Abstract move");
                this.logger.groupEnd(() => "Adding to queue: " + newPath);
                return;
            }
        }
        const resolvable = this.moveValidator.isEdgeResolvable(edge, path, visitedEdges.concat(edge), visitedGraphs, visitedFields, labelValues);
        if (!resolvable.success) {
            errors.add(resolvable.error);
            this.logger.groupEnd(() => "Not resolvable: " + resolvable.error);
            return;
        }
        const newPath = path.clone().move(edge);
        this.logger.log(() => "From indirect path, look for direct paths to " +
            typeName +
            "." +
            fieldName +
            " from: " +
            edge);
        const direct = this.findDirectPaths(newPath, typeName, fieldName, [edge], labelValues);
        if (direct.success) {
            this.logger.groupEnd(() => "Resolvable: " + edge + " with " + direct.paths.length + " paths");
            finalPaths.push(...direct.paths);
            resolvedGraphs.push(newPath.edge().tail.graphName);
            return;
        }
        errors.add(direct.errors);
        resolvedGraphs.push(newPath.edge().tail.graphName);
        queue.push([
            concatIfNotExistsString(visitedGraphs, edge.tail.graphName),
            "keyFields" in edge.move && edge.move.keyFields
                ? concatIfNotExistsFields(visitedFields, edge.move.keyFields)
                : visitedFields,
            newPath,
        ]);
        this.logger.log(() => "Did not find direct paths");
        this.logger.groupEnd(() => "Adding to queue: " + newPath);
    }
    findTypeIndirectly(path, typeName, visitedGraphs, visitedFields, labelValues, finalPaths, queue, resolvedGraphs, edge) {
        if (!isAbstractEdge(edge)) {
            this.logger.groupEnd(() => "Ignored");
            return;
        }
        if (resolvedGraphs.includes(edge.tail.graphName)) {
            this.logger.groupEnd(() => "Already resolved the graph");
            return;
        }
        if (edge.move.keyFields &&
            visitedFields.some((f) => f.equals(edge.move.keyFields))) {
            this.logger.groupEnd(() => "Ignore: already visited fields");
            return;
        }
        const newPath = path.clone().move(edge);
        if (edge.tail.typeName === typeName) {
            resolvedGraphs.push(edge.tail.graphName);
            finalPaths.push(newPath);
        }
        else {
            queue.push([
                visitedGraphs,
                edge.move.keyFields
                    ? concatIfNotExistsFields(visitedFields, edge.move.keyFields)
                    : visitedFields,
                newPath,
            ]);
        }
        this.logger.groupEnd(() => "Resolvable");
    }
    findIndirectPaths(path, typeName, fieldName, visitedEdges, visitedGraphs, visitedFields, labelValues) {
        const errors = new LazyErrors();
        const tail = path.tail() ?? path.rootNode();
        const sourceGraphName = tail.graphName;
        const isFieldTarget = fieldName !== null;
        const id = isFieldTarget
            ? `${typeName}.${fieldName}`
            : `... on ${typeName}`;
        this.logger.group(() => "Indirect paths to " + id + " from: " + tail);
        const queue = [
            [visitedGraphs, visitedFields, path],
        ];
        const finalPaths = [];
        const resolvedGraphs = [];
        while (queue.length > 0) {
            const item = queue.pop();
            if (!item) {
                throw new Error("Unexpected end of queue");
            }
            const [visitedGraphs, visitedFields, path] = item;
            const tail = path.tail() ?? path.rootNode();
            const edges = this.graph.indirectEdgesOfHead(tail);
            this.logger.log(() => "At path: " + path);
            this.logger.log(() => "Checking " + edges.length + " edges");
            let i = 0;
            for (const edge of edges) {
                this.logger.group(() => "Checking #" + i++ + " " + edge);
                this.logger.log(() => "Visited graphs: " + visitedGraphs.join(","));
                if (visitedGraphs.includes(edge.tail.graphName)) {
                    this.logger.groupEnd(() => "Ignore: already visited graph");
                    continue;
                }
                if (visitedEdges.includes(edge)) {
                    this.logger.groupEnd(() => "Ignore: already visited edge");
                    continue;
                }
                if (edge.tail.graphName === sourceGraphName && !isAbstractEdge(edge)) {
                    this.logger.groupEnd(() => "Ignore: we are back to the same graph");
                    continue;
                }
                if (isFieldTarget) {
                    this.findFieldIndirectly(path, typeName, fieldName, visitedEdges, visitedGraphs, visitedFields, labelValues, errors, finalPaths, queue, resolvedGraphs, edge);
                }
                else {
                    this.findTypeIndirectly(path, typeName, visitedGraphs, visitedFields, labelValues, finalPaths, queue, resolvedGraphs, edge);
                }
            }
        }
        this.logger.groupEnd(() => "Found " + finalPaths.length + " indirect paths");
        if (finalPaths.length === 0) {
            return {
                success: false,
                errors,
                paths: undefined,
            };
        }
        return {
            success: true,
            paths: finalPaths,
            errors: undefined,
        };
    }
}
