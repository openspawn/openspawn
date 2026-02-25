"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoInaccessibleOnImplementedInterfaceFieldsRule = NoInaccessibleOnImplementedInterfaceFieldsRule;
const graphql_1 = require("graphql");
function NoInaccessibleOnImplementedInterfaceFieldsRule(context, supergraphState) {
    return {
        ObjectTypeField(objectTypeState, fieldState) {
            if (fieldState.inaccessible && objectTypeState.interfaces.size) {
                for (const interfaceName of objectTypeState.interfaces) {
                    const interfaceType = supergraphState.interfaceTypes.get(interfaceName);
                    if (!interfaceType) {
                        continue;
                    }
                    const interfaceField = interfaceType.fields.get(fieldState.name);
                    if (!interfaceField) {
                        continue;
                    }
                    if (interfaceField.inaccessible === false &&
                        objectTypeState.inaccessible === false) {
                        const objectTypeFieldSchemaCoordinate = objectTypeState.name + "." + fieldState.name;
                        const interfaceFieldSchemaCoordinate = interfaceName + "." + fieldState.name;
                        context.reportError(new graphql_1.GraphQLError(`Field "${objectTypeFieldSchemaCoordinate}" is @inaccessible but implements the interface field "${interfaceFieldSchemaCoordinate}", which is in the API schema.`, {
                            extensions: {
                                code: "IMPLEMENTED_BY_INACCESSIBLE",
                            },
                        }));
                    }
                }
            }
        },
    };
}
