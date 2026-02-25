import { GraphQLError, introspectionTypes, Kind, parseValue, specifiedScalarTypes, } from "graphql";
import { andList } from "../../utils/format.js";
import { isList, isNonNull, stripList, stripNonNull, stripTypeModifiers, } from "../../utils/state.js";
import { TypeKind, } from "../state.js";
const specifiedScalars = new Set(specifiedScalarTypes.map((t) => t.name));
const SKIP = Symbol("skip");
export function validateSubgraphState(state, context) {
    const errors = [];
    function reportError(message) {
        errors.push(new GraphQLError(message, {
            extensions: {
                code: "INVALID_GRAPHQL",
            },
        }));
    }
    validateRootTypes(state, reportError);
    validateDirectives(state, reportError, context);
    validateTypes(state, reportError);
    return errors;
}
function validateRootTypes(state, reportError) {
    const rootTypesMap = new Map();
    for (const key in state.schema) {
        const rootTypeKind = key;
        const rootTypeName = state.schema[rootTypeKind];
        if (rootTypeName) {
            const rootType = state.types.get(rootTypeName);
            if (!rootType) {
                continue;
            }
            if (!isObjectType(rootType)) {
                const operationTypeStr = capitalize(rootTypeKind.replace("Type", ""));
                reportError(rootTypeKind === "queryType"
                    ? `${operationTypeStr} root type must be Object type, it cannot be ${rootTypeName}.`
                    : `${operationTypeStr} root type must be Object type if provided, it cannot be ${rootTypeName}.`);
            }
            else {
                const existing = rootTypesMap.get(rootTypeName);
                if (existing) {
                    existing.add(rootTypeKind);
                }
                else {
                    rootTypesMap.set(rootTypeName, new Set([rootTypeKind]));
                }
            }
        }
    }
    for (const [rootTypeName, operationTypes] of rootTypesMap) {
        if (operationTypes.size > 1) {
            const operationList = andList(Array.from(operationTypes).map((op) => capitalize(op.replace("Type", ""))));
            reportError(`All root types must be different, "${rootTypeName}" type is used as ${operationList} root types.`);
        }
    }
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function validateDirectives(state, reportError, context) {
    for (const directive of state.types.values()) {
        if (isDirective(directive)) {
            if (context.isLinkSpecDirective(directive.name)) {
                continue;
            }
            validateName(reportError, directive.name);
            for (const [argName, arg] of directive.args) {
                validateName(reportError, argName);
                const argInputTypeName = stripTypeModifiers(arg.type);
                if (context.isLinkSpecType(argInputTypeName)) {
                    continue;
                }
                const isInput = isInputType(state, argInputTypeName);
                if (isInput === SKIP) {
                    continue;
                }
                if (!isInput) {
                    reportError(`The type of @${directive.name}(${arg.name}:) must be Input Type ` +
                        `but got: ${arg.type}.`);
                }
                if (isRequiredArgument(arg) && arg.deprecated?.deprecated === true) {
                    reportError(`Required argument @${directive.name}(${arg.name}:) cannot be deprecated.`);
                }
            }
        }
    }
}
function validateTypes(state, reportError) {
    const validateInputObjectCircularRefs = createInputObjectCircularRefsValidator(state, reportError);
    const implementationsMap = new Map();
    for (const type of state.types.values()) {
        if (isInterfaceType(type)) {
            for (const iface of type.interfaces) {
                const interfaceType = state.types.get(iface);
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
        else if (isObjectType(type)) {
            for (const iface of type.interfaces) {
                const interfaceType = state.types.get(iface);
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
    }
    for (const type of state.types.values()) {
        if (!isIntrospectionType(type.name)) {
            validateName(reportError, type.name);
        }
        if (isObjectType(type)) {
            validateFields(state, reportError, type);
            validateInterfaces(state, implementationsMap, reportError, type);
        }
        else if (isInterfaceType(type)) {
            validateFields(state, reportError, type);
            validateInterfaces(state, implementationsMap, reportError, type);
        }
        else if (isUnionType(type)) {
            validateUnionMembers(state, reportError, type);
        }
        else if (isEnumType(type)) {
            validateEnumValues(reportError, type);
        }
        else if (isInputObjectType(type)) {
            validateInputFields(state, reportError, type);
            validateInputObjectCircularRefs(type);
        }
    }
}
function validateName(reportError, name) {
    if (name.startsWith("__")) {
        reportError(`Name "${name}" must not begin with "__", which is reserved by GraphQL introspection.`);
    }
}
function validateFields(state, reportError, type) {
    const fields = type.fields;
    const isRootType = type.name === state.schema.queryType ||
        type.name === state.schema.mutationType ||
        type.name === state.schema.subscriptionType;
    if (fields.size === 0 && !isRootType) {
        reportError(`Type ${type.name} must define one or more fields.`);
    }
    for (const field of fields.values()) {
        validateName(reportError, field.name);
        const fieldTypeName = stripTypeModifiers(field.type);
        const fieldTypeExists = typeExists(state, fieldTypeName);
        if (!fieldTypeExists) {
            continue;
        }
        const isOutput = isOutputType(state, fieldTypeName);
        if (isOutput === SKIP) {
            continue;
        }
        if (!isOutput) {
            reportError(`The type of "${type.name}.${field.name}" must be Output Type but got: "${field.type}".`);
        }
        for (const arg of field.args.values()) {
            const argName = arg.name;
            validateName(reportError, argName);
            const argTypeName = stripTypeModifiers(arg.type);
            const argTypeExists = typeExists(state, argTypeName);
            if (!argTypeExists) {
                continue;
            }
            const isInput = isInputType(state, argTypeName);
            if (isInput === SKIP) {
                continue;
            }
            if (!isInput) {
                const isList = arg.type.endsWith("]");
                const isNonNull = arg.type.endsWith("!");
                const extra = isList
                    ? ", a ListType"
                    : isNonNull
                        ? ", a NonNullType"
                        : "";
                reportError(`The type of "${type.name}.${field.name}(${argName}:)" must be Input Type but got "${arg.type}"${extra}.`);
            }
            if (isRequiredArgument(arg) && arg.deprecated?.deprecated) {
                reportError(`Required argument ${type.name}.${field.name}(${argName}:) cannot be deprecated.`);
            }
            if (typeof arg.defaultValue !== "undefined" &&
                !isValidateDefaultValue(state, reportError, arg.type, parseValue(arg.defaultValue))) {
                reportError(`Invalid default value (got: ${arg.defaultValue}) provided for argument ${type.name}.${field.name}(${arg.name}:) of type ${arg.type}.`);
            }
        }
    }
}
function isValidateDefaultValue(state, reportError, inputTypePrinted, value) {
    if (isNonNull(inputTypePrinted)) {
        if (value.kind === Kind.NULL) {
            return false;
        }
        return isValidateDefaultValue(state, reportError, stripNonNull(inputTypePrinted), value);
    }
    if (value.kind === Kind.NULL) {
        return true;
    }
    const inputTypeName = stripTypeModifiers(inputTypePrinted);
    const inputType = state.types.get(inputTypeName);
    if (inputType && isScalarType(inputType)) {
        return true;
    }
    if (isList(inputTypePrinted)) {
        if (value.kind === Kind.LIST) {
            return value.values.every((val) => isValidateDefaultValue(state, reportError, stripList(inputTypePrinted), val));
        }
        return isValidateDefaultValue(state, reportError, stripList(inputTypePrinted), value);
    }
    if (specifiedScalars.has(inputTypeName)) {
        const specifiedScalar = specifiedScalarTypes.find((t) => t.name === inputTypeName);
        try {
            specifiedScalar.parseLiteral(value);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    if (!inputType) {
        return true;
    }
    if (isInputObjectType(inputType)) {
        if (value.kind !== Kind.OBJECT) {
            return false;
        }
        const fields = inputType.fields;
        for (const astField of value.fields) {
            const field = fields.get(astField.name.value);
            if (!field) {
                return false;
            }
            if (!isValidateDefaultValue(state, reportError, field.type, astField.value)) {
                return false;
            }
        }
        return true;
    }
    if (isEnumType(inputType)) {
        if (value.kind !== Kind.ENUM && value.kind !== Kind.STRING) {
            return false;
        }
        return inputType.values.has(value.value);
    }
    return false;
}
function validateUnionMembers(state, reportError, union) {
    const memberTypes = union.members;
    if (memberTypes.size === 0) {
        reportError(`Union type ${union.name} must define one or more member types.`);
    }
    const includedTypeNames = new Set();
    for (const memberType of memberTypes) {
        if (includedTypeNames.has(memberType)) {
            reportError(`Union type ${union.name} can only include type ${memberType} once.`);
            continue;
        }
        includedTypeNames.add(memberType);
        const type = state.types.get(memberType);
        if (!type || !isObjectType(type)) {
            reportError(`Union type ${union.name} can only include Object types, ` +
                `it cannot include ${memberType}.`);
        }
    }
}
function validateEnumValues(reportError, enumType) {
    const enumValues = enumType.values;
    if (enumValues.size === 0) {
        reportError(`Enum type ${enumType.name} must define one or more values.`);
    }
    for (const enumValue of enumValues.keys()) {
        validateName(reportError, enumValue);
    }
}
function validateInputFields(state, reportError, inputObj) {
    const fields = inputObj.fields;
    if (fields.size === 0) {
        reportError(`Input Object type ${inputObj.name} must define one or more fields.`);
    }
    for (const field of fields.values()) {
        validateName(reportError, field.name);
        const fieldTypeName = stripTypeModifiers(field.type);
        const fieldTypeExists = typeExists(state, fieldTypeName);
        if (!fieldTypeExists) {
            continue;
        }
        const isInput = isInputType(state, fieldTypeName);
        if (isInput === SKIP) {
            continue;
        }
        if (!isInput) {
            const isList = field.type.endsWith("]");
            const isNonNull = field.type.endsWith("!");
            const extra = isList
                ? ", a ListType"
                : isNonNull
                    ? ", a NonNullType"
                    : "";
            reportError(`The type of ${inputObj.name}.${field.name} must be Input Type but got "${field.type}"${extra}.`);
        }
        if (isRequiredInputField(field) && field.deprecated?.deprecated) {
            reportError(`Required input field ${inputObj.name}.${field.name} cannot be deprecated.`);
        }
        if (typeof field.defaultValue !== "undefined" &&
            !isValidateDefaultValue(state, reportError, field.type, parseValue(field.defaultValue))) {
            reportError(`Invalid default value (got: ${field.defaultValue}) provided for input field ${inputObj.name}.${field.name} of type ${field.type}.`);
        }
    }
}
function validateInterfaces(state, implementationsMap, reportError, type) {
    const ifaceTypeNames = new Set();
    for (const iface of type.interfaces) {
        const interfaceType = state.types.get(iface);
        if (!interfaceType) {
            continue;
        }
        if (!isInterfaceType(interfaceType)) {
            reportError(`Type ${type.name} must only implement Interface types, it cannot implement ${iface}.`);
            continue;
        }
        if (type.name === iface) {
            reportError(`Type ${type.name} cannot implement itself because it would create a circular reference.`);
            continue;
        }
        if (ifaceTypeNames.has(iface)) {
            reportError(`Type ${type.name} can only implement ${iface} once.`);
            continue;
        }
        ifaceTypeNames.add(iface);
        validateTypeImplementsAncestors(reportError, type, interfaceType);
        validateTypeImplementsInterface(state, implementationsMap, reportError, type, interfaceType);
    }
}
function validateTypeImplementsAncestors(reportError, type, interfaceType) {
    const ifaceInterfaces = type.interfaces;
    for (const transitive of interfaceType.interfaces) {
        if (!ifaceInterfaces.has(transitive)) {
            reportError(transitive === type.name
                ? `Type ${type.name} cannot implement ${interfaceType.name} because it would create a circular reference.`
                : `Type ${type.name} must implement ${transitive} because it is implemented by ${interfaceType.name}.`);
        }
    }
}
function validateTypeImplementsInterface(state, implementationsMap, reportError, type, interfaceType) {
    const typeFieldMap = type.fields;
    for (const ifaceField of interfaceType.fields.values()) {
        const fieldName = ifaceField.name;
        const typeField = typeFieldMap.get(fieldName);
        if (typeField == null) {
            reportError(`Interface field ${interfaceType.name}.${fieldName} expected but ${type.name} does not provide it.`);
            continue;
        }
        if (!isTypeSubTypeOf(state, implementationsMap, typeField.type, ifaceField.type)) {
            reportError(`Interface field ${interfaceType.name}.${fieldName} expects type ` +
                `${ifaceField.type} but ${type.name}.${fieldName} of type ${typeField.type} is not a proper subtype.`);
        }
        for (const ifaceArg of ifaceField.args.values()) {
            const argName = ifaceArg.name;
            const typeArg = typeField.args.get(argName);
            if (!typeArg) {
                reportError(`Interface field argument ${interfaceType.name}.${fieldName}(${argName}:) expected but ${type.name}.${fieldName} does not provide it.`);
                continue;
            }
            if (ifaceArg.type !== typeArg.type) {
                reportError(`Interface field argument ${interfaceType.name}.${fieldName}(${argName}:) ` +
                    `expects type ${ifaceArg.type} but ` +
                    `${type.name}.${fieldName}(${argName}:) is type ` +
                    `${typeArg.type}.`);
            }
        }
        for (const typeArg of typeField.args.values()) {
            const argName = typeArg.name;
            const ifaceArg = ifaceField.args.get(argName);
            if (!ifaceArg && isRequiredArgument(typeArg)) {
                reportError(`Object field ${type.name}.${fieldName} includes required argument ${argName} that is missing from the Interface field ${interfaceType.name}.${fieldName}.`);
            }
        }
    }
}
export function isTypeSubTypeOf(state, implementationsMap, maybeSubTypeName, superTypeName) {
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
    const superType = state.types.get(superTypeName);
    const maybeSubType = state.types.get(maybeSubTypeName);
    if (!superType || !maybeSubType) {
        return false;
    }
    return (isAbstractType(superType) &&
        (isInterfaceType(maybeSubType) || isObjectType(maybeSubType)) &&
        isSubType(implementationsMap, superType, maybeSubType));
}
function isSubType(implementationsMap, abstractType, maybeSubType) {
    if (isUnionType(abstractType)) {
        return abstractType.members.has(maybeSubType.name);
    }
    return (implementationsMap.get(abstractType.name)?.has(maybeSubType.name) ?? false);
}
function createInputObjectCircularRefsValidator(state, reportError) {
    const visitedTypes = new Set();
    const fieldPath = [];
    const fieldPathIndexByTypeName = Object.create(null);
    return detectCycleRecursive;
    function detectCycleRecursive(inputObj) {
        if (visitedTypes.has(inputObj)) {
            return;
        }
        visitedTypes.add(inputObj);
        fieldPathIndexByTypeName[inputObj.name] = fieldPath.length;
        for (const field of inputObj.fields.values()) {
            if (isNonNull(field.type)) {
                const fieldType = state.types.get(stripNonNull(field.type));
                if (fieldType && isInputObjectType(fieldType)) {
                    const cycleIndex = fieldPathIndexByTypeName[fieldType.name];
                    fieldPath.push(field.name);
                    if (cycleIndex === undefined) {
                        detectCycleRecursive(fieldType);
                    }
                    else {
                        const cyclePath = fieldPath.slice(cycleIndex);
                        reportError(`Cannot reference Input Object "${fieldType.name}" within itself through a series of non-null fields: "${cyclePath.join(".")}".`);
                    }
                    fieldPath.pop();
                }
            }
        }
        fieldPathIndexByTypeName[inputObj.name] = undefined;
    }
}
function isIntrospectionType(typeName) {
    return introspectionTypes.some((t) => t.name === typeName);
}
function isAbstractType(type) {
    return isInterfaceType(type) || isUnionType(type);
}
function isRequiredArgument(arg) {
    return isNonNull(arg.type) && arg.defaultValue === undefined;
}
function isRequiredInputField(arg) {
    return isNonNull(arg.type) && arg.defaultValue === undefined;
}
function isOutputType(state, typeName) {
    const type = state.types.get(typeName);
    if (!type) {
        if (specifiedScalars.has(typeName)) {
            return true;
        }
        return SKIP;
    }
    return !isInputObjectType(type);
}
export function isInputType(state, typeName) {
    const type = state.types.get(typeName);
    if (!type) {
        if (specifiedScalars.has(typeName)) {
            return true;
        }
        return SKIP;
    }
    return isScalarType(type) || isEnumType(type) || isInputObjectType(type);
}
export function typeExists(state, typeName) {
    return state.types.has(typeName) || specifiedScalars.has(typeName);
}
export function isInputObjectType(type) {
    return type.kind === TypeKind.INPUT_OBJECT;
}
export function isScalarType(type) {
    return type.kind === TypeKind.SCALAR;
}
export function isEnumType(type) {
    return type.kind === TypeKind.ENUM;
}
export function isObjectType(type) {
    return type.kind === TypeKind.OBJECT;
}
export function isInterfaceType(type) {
    return type.kind === TypeKind.INTERFACE;
}
export function isUnionType(type) {
    return type.kind === TypeKind.UNION;
}
export function isDirective(type) {
    return type.kind === TypeKind.DIRECTIVE;
}
