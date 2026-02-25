"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredArgumentOrFieldIsNotInaccessibleRule = RequiredArgumentOrFieldIsNotInaccessibleRule;
const graphql_1 = require("graphql");
function RequiredArgumentOrFieldIsNotInaccessibleRule(context) {
    return {
        InputObjectTypeField(inputObjectState, fieldState) {
            if (!inputObjectState.inaccessible &&
                fieldState.inaccessible &&
                fieldState.type.endsWith("!")) {
                context.reportError(new graphql_1.GraphQLError(`Input field "${inputObjectState.name}.${fieldState.name}" is @inaccessible but is a required input field of its type.`, {
                    extensions: {
                        code: "REQUIRED_INACCESSIBLE",
                    },
                }));
            }
        },
        ObjectTypeFieldArg(objectState, fieldState, argState) {
            if (!fieldState.inaccessible &&
                argState.inaccessible &&
                argState.type.endsWith("!")) {
                context.reportError(new graphql_1.GraphQLError(`Argument "${objectState.name}.${fieldState.name}(${argState.name}:)" is @inaccessible but is a required argument of its field.`, {
                    extensions: {
                        code: "REQUIRED_INACCESSIBLE",
                    },
                }));
            }
        },
    };
}
