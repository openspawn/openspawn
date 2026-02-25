import { GraphQLError } from "graphql";
export function UniqueInputFieldNamesRule(context) {
    const knownNameStack = [];
    let knownNames = new Set();
    return {
        ObjectValue: {
            enter() {
                knownNameStack.push(knownNames);
                knownNames = new Set();
            },
            leave() {
                const prevKnownNames = knownNameStack.pop();
                if (!prevKnownNames) {
                    throw new Error("Assertion failed: nothing else in the stack");
                }
                knownNames = prevKnownNames;
            },
        },
        ObjectField(node) {
            const fieldName = node.name.value;
            if (knownNames.has(fieldName)) {
                context.reportError(new GraphQLError(`There can be only one input field named "${fieldName}".`, {
                    extensions: {
                        code: "INVALID_GRAPHQL",
                    },
                }));
            }
            else {
                knownNames.add(fieldName);
            }
        },
    };
}
