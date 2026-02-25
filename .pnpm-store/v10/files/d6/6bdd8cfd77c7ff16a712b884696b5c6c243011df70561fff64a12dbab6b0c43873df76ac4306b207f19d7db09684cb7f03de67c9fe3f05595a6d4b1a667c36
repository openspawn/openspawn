import { GraphQLError } from "graphql";
import { isList, isNonNull, stripList, stripNonNull, } from "../../../utils/state.js";
export function InterfaceSubtypeRule(context, supergraph) {
    const implementationsMap = new Map();
    for (const type of supergraph.interfaceTypes.values()) {
        for (const iface of type.interfaces) {
            const interfaceType = getTypeFromSupergraph(supergraph, iface);
            if (interfaceType && isInterfaceType(interfaceType)) {
                let implementations = implementationsMap.get(iface);
                if (implementations === undefined) {
                    implementationsMap.set(iface, new Set([type.name]));
                }
                else {
                    implementations.add(type.name);
                }
            }
        }
    }
    for (const type of supergraph.objectTypes.values()) {
        for (const iface of type.interfaces) {
            const interfaceType = getTypeFromSupergraph(supergraph, iface);
            if (interfaceType && isInterfaceType(interfaceType)) {
                let implementations = implementationsMap.get(iface);
                if (implementations === undefined) {
                    implementationsMap.set(iface, new Set([type.name]));
                }
                else {
                    implementations.add(type.name);
                }
            }
        }
    }
    return {
        ObjectTypeField(objectTypeState, fieldState) {
            if (objectTypeState.interfaces.size === 0) {
                return;
            }
            const interfaceNames = Array.from(objectTypeState.interfaces.values());
            for (const interfaceName of interfaceNames) {
                const interfaceState = supergraph.interfaceTypes.get(interfaceName);
                if (!interfaceState) {
                    continue;
                }
                const interfaceField = interfaceState.fields.get(fieldState.name);
                if (!interfaceField) {
                    continue;
                }
                if (!isTypeSubTypeOf(supergraph, implementationsMap, fieldState.type, interfaceField.type)) {
                    context.reportError(new GraphQLError(`Interface field ${interfaceName}.${interfaceField.name} expects type ${interfaceField.type} but ${objectTypeState.name}.${fieldState.name} of type ${fieldState.type} is not a proper subtype.`, {
                        extensions: {
                            code: "INVALID_GRAPHQL",
                        },
                    }));
                }
            }
        },
    };
}
function isTypeSubTypeOf(state, implementationsMap, maybeSubTypeName, superTypeName) {
    if (maybeSubTypeName === superTypeName) {
        return true;
    }
    if (isNonNull(superTypeName)) {
        if (isNonNull(maybeSubTypeName)) {
            return isTypeSubTypeOf(state, implementationsMap, stripNonNull(maybeSubTypeName), stripNonNull(superTypeName));
        }
        return false;
    }
    if (isNonNull(maybeSubTypeName)) {
        return isTypeSubTypeOf(state, implementationsMap, stripNonNull(maybeSubTypeName), superTypeName);
    }
    if (isList(superTypeName)) {
        if (isList(maybeSubTypeName)) {
            return isTypeSubTypeOf(state, implementationsMap, stripList(maybeSubTypeName), stripList(superTypeName));
        }
        return false;
    }
    if (isList(maybeSubTypeName)) {
        return false;
    }
    const superType = getTypeFromSupergraph(state, superTypeName);
    const maybeSubType = getTypeFromSupergraph(state, maybeSubTypeName);
    if (!superType || !maybeSubType) {
        return false;
    }
    return (isAbstractType(superType) &&
        (isInterfaceType(maybeSubType) || isObjectType(maybeSubType)) &&
        isSubType(implementationsMap, superType, maybeSubType));
}
function getTypeFromSupergraph(state, name) {
    return (state.objectTypes.get(name) ??
        state.interfaceTypes.get(name) ??
        state.unionTypes.get(name));
}
function isSubType(implementationsMap, abstractType, maybeSubType) {
    if (isUnionType(abstractType)) {
        return abstractType.members.has(maybeSubType.name);
    }
    return (implementationsMap.get(abstractType.name)?.has(maybeSubType.name) ?? false);
}
function isAbstractType(type) {
    return isInterfaceType(type) || isUnionType(type);
}
function isObjectType(type) {
    return type.kind === "object";
}
function isInterfaceType(type) {
    return type.kind === "interface";
}
function isUnionType(type) {
    return type.kind === "union";
}
