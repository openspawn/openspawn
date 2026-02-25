"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visitSupergraphState = visitSupergraphState;
function visitSupergraphState(supergraphState, visitors) {
    supergraphState.objectTypes.forEach((objectTypeState) => {
        for (const visitor of visitors) {
            if (visitor.ObjectType) {
                visitor.ObjectType(objectTypeState);
            }
        }
        for (const fieldState of objectTypeState.fields.values()) {
            for (const visitor of visitors) {
                if (visitor.ObjectTypeField) {
                    visitor.ObjectTypeField(objectTypeState, fieldState);
                }
            }
            for (const argState of fieldState.args.values()) {
                for (const visitor of visitors) {
                    if (visitor.ObjectTypeFieldArg) {
                        visitor.ObjectTypeFieldArg(objectTypeState, fieldState, argState);
                    }
                }
            }
        }
    });
    supergraphState.enumTypes.forEach((enumTypeState) => {
        for (const visitor of visitors) {
            if (visitor.EnumType) {
                visitor.EnumType(enumTypeState);
            }
        }
    });
    supergraphState.inputObjectTypes.forEach((inputObjectTypeState) => {
        for (const visitor of visitors) {
            if (visitor.InputObjectType) {
                visitor.InputObjectType(inputObjectTypeState);
            }
        }
        for (const fieldState of inputObjectTypeState.fields.values()) {
            for (const visitor of visitors) {
                if (visitor.InputObjectTypeField) {
                    visitor.InputObjectTypeField(inputObjectTypeState, fieldState);
                }
            }
        }
    });
    supergraphState.interfaceTypes.forEach((interfaceTypeState) => {
        for (const visitor of visitors) {
            if (visitor.InterfaceType) {
                visitor.InterfaceType(interfaceTypeState);
            }
        }
        for (const fieldState of interfaceTypeState.fields.values()) {
            for (const visitor of visitors) {
                if (visitor.InterfaceTypeField) {
                    visitor.InterfaceTypeField(interfaceTypeState, fieldState);
                }
            }
        }
    });
    supergraphState.directives.forEach((directiveState) => {
        for (const visitor of visitors) {
            if (visitor.Directive) {
                visitor.Directive(directiveState);
            }
            if (visitor.DirectiveFieldArg) {
                for (const directiveArgState of directiveState.args.values()) {
                    visitor.DirectiveFieldArg(directiveState, directiveArgState);
                }
            }
        }
    });
}
