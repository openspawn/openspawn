import { GraphQLError, Kind, specifiedScalarTypes, } from "graphql";
import { parseFields } from "../../../subgraph/helpers.js";
import { mergeScopePolicies } from "../../../utils/auth.js";
export function AuthOnRequiresRule(context, supergraph) {
    return {
        ObjectTypeField(objectTypeState, fieldState) {
            for (const [graphId, fieldInGraph] of fieldState.byGraph) {
                if (!fieldInGraph.requires) {
                    continue;
                }
                const selectionSet = parseFields(fieldInGraph.requires);
                if (!selectionSet) {
                    continue;
                }
                const provisionedAccess = new ProvisionedAccess(objectTypeState, fieldState);
                let fieldLackingAccess = ensureAccessToSelectionSet(supergraph, objectTypeState, selectionSet, provisionedAccess);
                if (fieldLackingAccess) {
                    context.reportError(createAccessRequirementError(context.graphIdToName(graphId), `${objectTypeState.name}.${fieldState.name}`, fieldLackingAccess));
                    return;
                }
            }
        },
    };
}
function ensureAccessToSelectionSet(supergraph, currentType, selectionSet, provisionedAccess) {
    for (const selection of selectionSet.selections) {
        switch (selection.kind) {
            case Kind.FIELD: {
                if (currentType.kind === "union") {
                    if (selection.name.value !== "__typename") {
                        throw new Error("Cannot select fields directly on union types.");
                    }
                    for (const memberTypeName of currentType.members) {
                        const memberType = supergraph.objectTypes.get(memberTypeName);
                        if (memberType && !provisionedAccess.canAccess(memberType)) {
                            return memberTypeName;
                        }
                    }
                    return;
                }
                const fieldLackingAccess = ensureAccessToField(supergraph, currentType, selection, provisionedAccess);
                if (fieldLackingAccess) {
                    return fieldLackingAccess;
                }
                break;
            }
            case Kind.INLINE_FRAGMENT: {
                const fieldLackingAccess = ensureAccessToInlineFragment(supergraph, currentType, selection, provisionedAccess);
                if (fieldLackingAccess) {
                    return fieldLackingAccess;
                }
                break;
            }
            case Kind.FRAGMENT_SPREAD: {
                throw new Error("Fragment spreads are not supported in @requires.");
            }
        }
    }
}
function ensureAccessToField(supergraph, currentType, fieldNode, provisionedAccess) {
    if (fieldNode.name.value === "__typename") {
        return;
    }
    let fieldName = fieldNode.name.value;
    let fieldState = currentType.fields.get(fieldNode.name.value);
    let fieldDetails = null;
    if (fieldState) {
        fieldDetails = {
            type: fieldState.type,
            scopes: fieldState.scopes,
            policies: fieldState.policies,
            authenticated: fieldState.authenticated,
        };
    }
    else {
        if (currentType.kind === "interface") {
            throw new Error(`Field "${fieldNode.name.value}" not found on interface type "${currentType.name}".`);
        }
        for (const interfaceName of currentType.interfaces) {
            const interfaceType = supergraph.interfaceTypes.get(interfaceName);
            if (!interfaceType) {
                throw new Error(`Interface "${interfaceName}" implemented by "${currentType.name}" not found in supergraph.`);
            }
            const interfaceFieldState = interfaceType.fields.get(fieldNode.name.value);
            if (interfaceFieldState) {
                if (!fieldDetails) {
                    fieldDetails = {
                        type: interfaceFieldState.type,
                        scopes: mergeScopePolicies([], interfaceFieldState.scopes),
                        policies: mergeScopePolicies([], interfaceFieldState.policies),
                        authenticated: interfaceFieldState.authenticated,
                    };
                }
                else {
                    fieldDetails = {
                        type: interfaceFieldState.type,
                        scopes: mergeScopePolicies(fieldDetails.scopes, interfaceFieldState.scopes),
                        policies: mergeScopePolicies(fieldDetails.policies, interfaceFieldState.policies),
                        authenticated: interfaceFieldState.authenticated
                            ? true
                            : fieldDetails.authenticated,
                    };
                }
            }
        }
    }
    if (fieldDetails === null) {
        throw new Error(`Field "${fieldName}" not found on type "${currentType.name}".`);
    }
    if (!provisionedAccess.canAccess(fieldDetails)) {
        return `${currentType.name}.${fieldName}`;
    }
    const outputTypeName = extractNamedTypeName(fieldDetails.type);
    if (!outputTypeName) {
        throw new Error(`Unable to extract output type name from field "${currentType.name}.${fieldName}" type "${fieldDetails.type}".`);
    }
    if (specifiedScalarTypes.some((s) => s.name === outputTypeName)) {
        return;
    }
    const outputType = supergraph.objectTypes.get(outputTypeName) ??
        supergraph.interfaceTypes.get(outputTypeName) ??
        supergraph.enumTypes.get(outputTypeName) ??
        supergraph.scalarTypes.get(outputTypeName) ??
        supergraph.unionTypes.get(outputTypeName);
    if (!outputType) {
        throw new Error(`Output type "${outputTypeName}" of field "${currentType.name}.${fieldName}" not found in supergraph.`);
    }
    if (outputType.kind !== "union" && !provisionedAccess.canAccess(outputType)) {
        return `${currentType.name}.${fieldName}`;
    }
    if (!fieldNode.selectionSet) {
        return;
    }
    if (outputType.kind === "enum" || outputType.kind === "scalar") {
        throw new Error(`Field "${currentType.name}.${fieldName}" of type "${outputType.name}" cannot have a selection set.`);
    }
    return ensureAccessToSelectionSet(supergraph, outputType, fieldNode.selectionSet, provisionedAccess);
}
function ensureAccessToInlineFragment(supergraph, currentType, inlineFragment, provisionedAccess) {
    const concreteType = inlineFragment.typeCondition
        ? (supergraph.objectTypes.get(inlineFragment.typeCondition.name.value) ??
            supergraph.interfaceTypes.get(inlineFragment.typeCondition.name.value))
        : currentType;
    if (!concreteType) {
        throw new Error(`Type "${currentType.name}" not found in supergraph for inline fragment.`);
    }
    if (concreteType.kind == "union") {
        throw new Error("Cannot have inline fragments on union types without type conditions.");
    }
    if (!provisionedAccess.canAccess(concreteType)) {
        return concreteType.name;
    }
    return ensureAccessToSelectionSet(supergraph, concreteType, inlineFragment.selectionSet, provisionedAccess);
}
function createAccessRequirementError(graphName, fieldWithRequiresCoordinate, authCoordinate) {
    const strDataRef = authCoordinate.includes(".")
        ? `field "${authCoordinate}"`
        : `type "${authCoordinate}"`;
    return new GraphQLError(`[${graphName}] Field "${fieldWithRequiresCoordinate}" does not specify necessary @authenticated, @requiresScopes and/or @policy auth requirements to access the transitive ${strDataRef} data from @requires selection set.`, {
        extensions: {
            code: "MISSING_TRANSITIVE_AUTH_REQUIREMENTS",
        },
    });
}
function extractNamedTypeName(typeStr) {
    let typeName = typeStr;
    if (!typeName)
        return null;
    typeName = typeName.replace(/[![\]]/g, "");
    return typeName || null;
}
class ProvisionedAccess {
    scopes;
    policies;
    authenticated;
    constructor(objectTypeState, fieldState) {
        this.scopes = [];
        this.policies = [];
        this.authenticated = false;
        if (objectTypeState.authenticated) {
            this.authenticated = true;
        }
        if (objectTypeState.scopes.length > 0) {
            this.scopes = objectTypeState.scopes.slice();
        }
        if (objectTypeState.policies.length > 0) {
            this.policies = objectTypeState.policies.slice();
        }
        if (fieldState.authenticated) {
            this.authenticated = true;
        }
        if (fieldState.scopes.length > 0) {
            this.scopes = mergeScopePolicies(this.scopes, fieldState.scopes);
        }
        if (fieldState.policies.length > 0) {
            this.policies = mergeScopePolicies(this.policies, fieldState.policies);
        }
    }
    canAccess(required) {
        if (required.authenticated && !this.authenticated) {
            return false;
        }
        for (const requiredScopeGroup of required.scopes) {
            const satisfiedByAny = this.scopes.some((providedGroup) => requiredScopeGroup.every((scope) => providedGroup.includes(scope)));
            if (!satisfiedByAny) {
                return false;
            }
        }
        for (const requiredPolicyGroup of required.policies) {
            const satisfiedByAny = this.policies.some((providedGroup) => requiredPolicyGroup.every((policy) => providedGroup.includes(policy)));
            if (!satisfiedByAny) {
                return false;
            }
        }
        return true;
    }
}
