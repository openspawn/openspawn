import { GraphQLError } from "graphql";
export function ListSizeSlicingArgumentsRule(context, supergraph) {
    return {
        ObjectTypeField(objectState, fieldState) {
            let error = ensureSlicingArgumentsExist(objectState.name, fieldState);
            if (error) {
                context.reportError(error);
            }
        },
        InterfaceTypeField(interfaceState, fieldState) {
            let error = ensureSlicingArgumentsExist(interfaceState.name, fieldState);
            if (error) {
                context.reportError(error);
                return;
            }
            if (!fieldState?.listSize ||
                !fieldState?.listSize.slicingArguments?.length) {
                return;
            }
            for (const implementorName of interfaceState.implementedBy) {
                const implementorType = supergraph.objectTypes.get(implementorName);
                if (!implementorType) {
                    continue;
                }
                let implementorField = implementorType.fields.get(fieldState.name);
                if (!implementorField) {
                    continue;
                }
                if (!implementorField.listSize) {
                    continue;
                }
                if (!implementorField.listSize.slicingArguments?.length) {
                    continue;
                }
                fieldState.listSize.printRequireOneSlicingArgument = true;
            }
        },
    };
}
function ensureSlicingArgumentsExist(typeName, fieldState) {
    if (!fieldState.listSize?.slicingArguments?.length) {
        return;
    }
    const newslicingArguments = [];
    for (const argName of fieldState.listSize.slicingArguments) {
        const argState = fieldState.args.get(argName);
        if (!argState) {
            throw new Error("Could not find the argument in the field annotated with @listSize");
        }
        if (argState.byGraph.size !== fieldState.byGraph.size) {
            continue;
        }
        newslicingArguments.push(argName);
    }
    if (!newslicingArguments.length) {
        return new GraphQLError([
            `All arguments for @listSize(slicingArguments:) on field "${typeName}.${fieldState.name}" were disregarded.`,
            `For an argument to be valid, it must be defined in every subgraph where the field exists.`,
        ].join(" "), {
            extensions: {
                code: "LIST_SIZE_INVALID_SLICING_ARGUMENT",
            },
        });
    }
    fieldState.listSize.slicingArguments = newslicingArguments;
}
