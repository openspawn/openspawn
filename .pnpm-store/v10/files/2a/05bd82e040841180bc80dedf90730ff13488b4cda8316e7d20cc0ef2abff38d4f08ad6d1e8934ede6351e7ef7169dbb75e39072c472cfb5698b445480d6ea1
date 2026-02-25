"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatisfiabilityRule = SatisfiabilityRule;
const graphql_1 = require("graphql");
const state_js_1 = require("../../../utils/state.js");
const edge_js_1 = require("./satisfiablity/edge.js");
const supergraph_js_1 = require("./satisfiablity/supergraph.js");
function SatisfiabilityRule(context, supergraphState) {
    const supergraph = new supergraph_js_1.Supergraph(supergraphState);
    const unreachables = supergraph.validate();
    const errorByCoordinate = {};
    for (const unreachable of unreachables) {
        const edge = unreachable.superPath.edge();
        if (!edge) {
            throw new Error("Expected edge to be defined");
        }
        if ((0, edge_js_1.isFieldEdge)(edge)) {
            const fieldCoordinate = `${edge.move.typeName}.${edge.move.fieldName}`;
            if (!errorByCoordinate[fieldCoordinate]) {
                errorByCoordinate[fieldCoordinate] = [];
            }
            errorByCoordinate[fieldCoordinate].push(unreachable);
        }
        else {
            const coordinate = edge.head.typeName;
            if (!errorByCoordinate[coordinate]) {
                errorByCoordinate[coordinate] = [];
            }
            errorByCoordinate[coordinate].push(unreachable);
        }
    }
    function check(typeName, fieldName) {
        const coordinate = fieldName ? `${typeName}.${fieldName}` : typeName;
        const unreachables = errorByCoordinate[coordinate];
        if (!unreachables?.length) {
            return;
        }
        for (const unreachable of unreachables) {
            const queryString = printQueryPath(supergraphState, unreachable.superPath.steps());
            if (!queryString) {
                return;
            }
            const errorsBySourceGraph = {};
            const reasons = [];
            for (const error of unreachable.listErrors()) {
                const sourceGraphName = error.sourceGraphName;
                if (!errorsBySourceGraph[sourceGraphName]) {
                    errorsBySourceGraph[sourceGraphName] = [];
                }
                errorsBySourceGraph[sourceGraphName].push(error);
            }
            for (const sourceGraphName in errorsBySourceGraph) {
                const errors = errorsBySourceGraph[sourceGraphName];
                reasons.push([sourceGraphName, errors.map((e) => e.message)]);
            }
            if (reasons.length === 0) {
                continue;
            }
            context.reportError(new graphql_1.GraphQLError([
                "The following supergraph API query:",
                queryString,
                "cannot be satisfied by the subgraphs because:",
                ...reasons.map(([graphName, reasons]) => {
                    if (reasons.length === 1) {
                        return `- from subgraph "${graphName}": ${reasons[0]}`;
                    }
                    return (`- from subgraph "${graphName}":\n` +
                        reasons.map((r) => `  - ${r}`).join("\n"));
                }),
            ].join("\n"), {
                extensions: {
                    code: "SATISFIABILITY_ERROR",
                },
            }));
        }
    }
    return {
        InterfaceType(interfaceState) {
            check(interfaceState.name);
            interfaceState.implementedBy.forEach((typeName) => check(typeName));
        },
        ObjectType(objectState) {
            check(objectState.name);
        },
        InterfaceTypeField(interfaceState, fieldState) {
            check(interfaceState.name, fieldState.name);
            interfaceState.implementedBy.forEach((typeName) => check(typeName, fieldState.name));
        },
        ObjectTypeField(objectState, fieldState) {
            check(objectState.name, fieldState.name);
        },
    };
}
function printLine(msg, indentLevel) {
    return "  ".repeat(indentLevel + 1) + msg;
}
function printQueryPath(supergraphState, queryPath) {
    const lines = [];
    let endsWithScalar = false;
    for (let i = 0; i < queryPath.length; i++) {
        const point = queryPath[i];
        if ("fieldName" in point) {
            const typeState = supergraphState.objectTypes.get(point.typeName);
            if (!typeState) {
                throw new Error(`Object type "${point.typeName}" not found in Supergraph state`);
            }
            let fieldState = typeState?.fields.get(point.fieldName);
            if (!fieldState) {
                for (const interfaceName of typeState.interfaces) {
                    const interfaceState = supergraphState.interfaceTypes.get(interfaceName);
                    if (!interfaceState) {
                        throw new Error(`Interface type "${interfaceName}" not found in Supergraph state`);
                    }
                    fieldState = interfaceState.fields.get(point.fieldName);
                    if (fieldState) {
                        break;
                    }
                }
            }
            if (!fieldState) {
                throw new Error(`Field "${point.typeName}.${point.fieldName}" not found in Supergraph state`);
            }
            const args = Array.from(fieldState.args)
                .map(([name, argState]) => `${name}: ${(0, graphql_1.print)(createEmptyValueNode(argState.type, supergraphState))}`)
                .join(", ");
            const argsPrinted = args.length > 0 ? `(${args})` : "";
            if (i == queryPath.length - 1) {
                const outputTypeName = (0, state_js_1.stripTypeModifiers)(fieldState.type);
                endsWithScalar =
                    supergraphState.scalarTypes.has(outputTypeName) ||
                        supergraphState.enumTypes.has(outputTypeName) ||
                        graphql_1.specifiedScalarTypes.some((s) => s.name === outputTypeName);
                if (endsWithScalar) {
                    lines.push(printLine(`${point.fieldName}${argsPrinted}`, i));
                }
                else {
                    lines.push(printLine(`${point.fieldName}${argsPrinted} {`, i));
                }
            }
            else {
                lines.push(printLine(`${point.fieldName}${argsPrinted} {`, i));
            }
        }
        else {
            lines.push(printLine(`... on ${point.typeName} {`, i));
        }
    }
    if (!endsWithScalar) {
        lines.push(printLine("...", lines.length));
    }
    const len = lines.length - 1;
    for (let i = 0; i < len; i++) {
        lines.push(printLine("}", len - i - 1));
    }
    if (queryPath[0].typeName === "Query") {
        lines.unshift("{");
    }
    else if (queryPath[0].typeName === "Mutation") {
        lines.unshift("mutation {");
    }
    else {
        lines.unshift("subscription {");
    }
    lines.push("}");
    return lines.join("\n");
}
function createEmptyValueNode(fullType, supergraphState) {
    if ((0, state_js_1.isList)(fullType)) {
        return {
            kind: graphql_1.Kind.LIST,
            values: [],
        };
    }
    if ((0, state_js_1.isNonNull)(fullType)) {
        const innerType = (0, state_js_1.stripNonNull)(fullType);
        return createEmptyValueNode(innerType, supergraphState);
    }
    if (supergraphState.enumTypes.has(fullType)) {
        const enumState = supergraphState.enumTypes.get(fullType);
        return {
            kind: graphql_1.Kind.ENUM,
            value: Array.from(enumState.values.keys())[0],
        };
    }
    if (supergraphState.scalarTypes.has(fullType)) {
        return {
            kind: graphql_1.Kind.STRING,
            value: "A string value",
        };
    }
    if (supergraphState.inputObjectTypes.has(fullType)) {
        const inputObjectTypeState = supergraphState.inputObjectTypes.get(fullType);
        return {
            kind: graphql_1.Kind.OBJECT,
            fields: Array.from(inputObjectTypeState.fields)
                .filter(([_, fieldState]) => (0, state_js_1.isNonNull)(fieldState.type))
                .map(([fieldName, fieldState]) => ({
                kind: graphql_1.Kind.OBJECT_FIELD,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: fieldName,
                },
                value: createEmptyValueNode(fieldState.type, supergraphState),
            })),
        };
    }
    const specifiedScalar = graphql_1.specifiedScalarTypes.find((s) => s.name === fullType);
    if (!specifiedScalar) {
        throw new Error(`Type "${fullType}" is not defined.`);
    }
    if (specifiedScalar.name === "String") {
        return {
            kind: graphql_1.Kind.STRING,
            value: "A string value",
        };
    }
    if (specifiedScalar.name === "Int" || specifiedScalar.name === "Float") {
        return {
            kind: graphql_1.Kind.INT,
            value: "0",
        };
    }
    if (specifiedScalar.name === "Boolean") {
        return {
            kind: graphql_1.Kind.BOOLEAN,
            value: true,
        };
    }
    if (specifiedScalar.name === "ID") {
        return {
            kind: graphql_1.Kind.STRING,
            value: "<any id>",
        };
    }
    throw new Error(`Type "${fullType}" is not supported.`);
}
