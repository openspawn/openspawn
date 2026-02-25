"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumValuesRule = EnumValuesRule;
const graphql_1 = require("graphql");
function EnumValuesRule(context) {
    return {
        EnumType(enumTypeState) {
            if (enumTypeState.referencedByInputType &&
                enumTypeState.referencedByOutputType) {
                const missingValues = [];
                const total = enumTypeState.byGraph.size;
                for (const [valueName, valueState] of enumTypeState.values) {
                    if (valueState.byGraph.size !== total) {
                        if (!valueState.inaccessible) {
                            missingValues.push(valueName);
                        }
                    }
                }
                if (missingValues.length === 0) {
                    return;
                }
                const exampleInputType = `(for example, as type of "${enumTypeState.inputTypeReferences.values().next().value}")`;
                const exampleOutputType = `(for example, as type of "${enumTypeState.outputTypeReferences.values().next().value}")`;
                for (const missingValue of missingValues) {
                    const valueState = enumTypeState.values.get(missingValue);
                    const definedIn = Array.from(valueState.byGraph.keys()).map(context.graphIdToName);
                    const notDefinedIn = Array.from(enumTypeState.byGraph.keys())
                        .filter((key) => !valueState.byGraph.has(key))
                        .map(context.graphIdToName);
                    const msg = [
                        `Enum type "${enumTypeState.name}" is used as both input type ${exampleInputType} and output type ${exampleOutputType},`,
                        `but value "${missingValue}" is not defined in all the subgraphs defining "${enumTypeState.name}":`,
                        `"${missingValue}" is defined in subgraph${definedIn.length > 1 ? "s" : ""} "${definedIn.join('", "')}"`,
                        `but not in subgraph${notDefinedIn.length > 1 ? "s" : ""} "${notDefinedIn.join('", "')}"`,
                    ].join(" ");
                    context.reportError(new graphql_1.GraphQLError(msg, {
                        extensions: {
                            code: "ENUM_VALUE_MISMATCH",
                        },
                    }));
                }
            }
            else if (enumTypeState.referencedByInputType) {
                const valuesInCommon = [];
                const total = enumTypeState.byGraph.size;
                for (const [valueName, valueState] of enumTypeState.values) {
                    if (valueState.byGraph.size === total) {
                        valuesInCommon.push(valueName);
                    }
                }
                if (valuesInCommon.length === 0) {
                    context.reportError(new graphql_1.GraphQLError(`None of the values of enum type "${enumTypeState.name}" are defined consistently in all the subgraphs defining that type. As only values common to all subgraphs are merged, this would result in an empty type.`, {
                        extensions: {
                            code: "EMPTY_MERGED_ENUM_TYPE",
                        },
                    }));
                }
            }
        },
    };
}
