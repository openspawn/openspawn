"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDecorators = getDecorators;
exports.getModifiers = getModifiers;
exports.isArray = isArray;
exports.getTypeArguments = getTypeArguments;
exports.isBoolean = isBoolean;
exports.isString = isString;
exports.isStringLiteral = isStringLiteral;
exports.isBigInt = isBigInt;
exports.isNumber = isNumber;
exports.isInterface = isInterface;
exports.isEnum = isEnum;
exports.isEnumLiteral = isEnumLiteral;
exports.isNull = isNull;
exports.isUndefined = isUndefined;
exports.hasFlag = hasFlag;
exports.hasObjectFlag = hasObjectFlag;
exports.getText = getText;
exports.getDefaultTypeFormatFlags = getDefaultTypeFormatFlags;
exports.getDecoratorArguments = getDecoratorArguments;
exports.getDecoratorName = getDecoratorName;
exports.getJSDocDescription = getJSDocDescription;
exports.hasJSDocTags = hasJSDocTags;
exports.getJsDocDeprecation = getJsDocDeprecation;
exports.findNullableTypeFromUnion = findNullableTypeFromUnion;
exports.hasModifiers = hasModifiers;
exports.hasDecorators = hasDecorators;
exports.hasImport = hasImport;
exports.createImportEquals = createImportEquals;
exports.createNamedImport = createNamedImport;
exports.isCallExpressionOf = isCallExpressionOf;
exports.serializePrimitiveObjectToAst = serializePrimitiveObjectToAst;
exports.safelyMergeObjects = safelyMergeObjects;
exports.updateDecoratorArguments = updateDecoratorArguments;
const ts = require("typescript");
const typescript_1 = require("typescript");
const plugin_utils_1 = require("./plugin-utils");
function getDecorators(node) {
    return (ts.canHaveDecorators(node) && ts.getDecorators(node)) ?? [];
}
function getModifiers(node) {
    return (ts.canHaveModifiers(node) && ts.getModifiers(node)) ?? [];
}
function isArray(type) {
    const symbol = type.getSymbol();
    if (!symbol) {
        return false;
    }
    return symbol.getName() === 'Array' && getTypeArguments(type).length === 1;
}
function getTypeArguments(type) {
    return type.typeArguments || [];
}
function isBoolean(type) {
    return hasFlag(type, typescript_1.TypeFlags.Boolean);
}
function isString(type) {
    return hasFlag(type, typescript_1.TypeFlags.String);
}
function isStringLiteral(type) {
    return hasFlag(type, typescript_1.TypeFlags.StringLiteral) && !type.isUnion();
}
function isBigInt(type) {
    return hasFlag(type, typescript_1.TypeFlags.BigInt);
}
function isNumber(type) {
    return hasFlag(type, typescript_1.TypeFlags.Number);
}
function isInterface(type) {
    return hasObjectFlag(type, typescript_1.ObjectFlags.Interface);
}
function isEnum(type) {
    const hasEnumFlag = hasFlag(type, typescript_1.TypeFlags.Enum);
    if (hasEnumFlag) {
        return true;
    }
    if (isEnumLiteral(type)) {
        return false;
    }
    const symbol = type.getSymbol();
    if (!symbol) {
        return false;
    }
    const valueDeclaration = symbol.valueDeclaration;
    if (!valueDeclaration) {
        return false;
    }
    return valueDeclaration.kind === typescript_1.SyntaxKind.EnumDeclaration;
}
function isEnumLiteral(type) {
    return hasFlag(type, typescript_1.TypeFlags.EnumLiteral) && !type.isUnion();
}
function isNull(type) {
    if (type.isUnion()) {
        return Boolean(type.types.find((t) => hasFlag(t, typescript_1.TypeFlags.Null)));
    }
    else {
        return hasFlag(type, typescript_1.TypeFlags.Null);
    }
}
function isUndefined(type) {
    if (type.isUnion()) {
        return Boolean(type.types.find((t) => hasFlag(t, typescript_1.TypeFlags.Undefined)));
    }
    else {
        return hasFlag(type, typescript_1.TypeFlags.Undefined);
    }
}
function hasFlag(type, flag) {
    return (type.flags & flag) === flag;
}
function hasObjectFlag(type, flag) {
    return (type.objectFlags & flag) === flag;
}
function getText(type, typeChecker, enclosingNode, typeFormatFlags) {
    if (!typeFormatFlags) {
        typeFormatFlags = getDefaultTypeFormatFlags(enclosingNode);
    }
    const compilerNode = !enclosingNode ? undefined : enclosingNode;
    return typeChecker.typeToString(type, compilerNode, typeFormatFlags);
}
function getDefaultTypeFormatFlags(enclosingNode) {
    let formatFlags = typescript_1.TypeFormatFlags.UseTypeOfFunction |
        typescript_1.TypeFormatFlags.NoTruncation |
        typescript_1.TypeFormatFlags.UseFullyQualifiedType |
        typescript_1.TypeFormatFlags.WriteTypeArgumentsOfSignature;
    if (enclosingNode && enclosingNode.kind === typescript_1.SyntaxKind.TypeAliasDeclaration)
        formatFlags |= typescript_1.TypeFormatFlags.InTypeAlias;
    return formatFlags;
}
function getDecoratorArguments(decorator) {
    const callExpression = decorator.expression;
    return (callExpression && callExpression.arguments) || [];
}
function getDecoratorName(decorator) {
    const isDecoratorFactory = decorator.expression.kind === typescript_1.SyntaxKind.CallExpression;
    if (isDecoratorFactory) {
        const callExpression = decorator.expression;
        if (callExpression.expression?.kind === ts.SyntaxKind.PropertyAccessExpression) {
            // When "import * as _" is used
            const propertyAccessExpression = callExpression.expression;
            return getIdentifierFromName(propertyAccessExpression.name).getText();
        }
        if (callExpression.kind === ts.SyntaxKind.CallExpression) {
            const identifier = callExpression.expression;
            if ((0, plugin_utils_1.isDynamicallyAdded)(identifier)) {
                return undefined;
            }
            return getIdentifierFromName(identifier).getText();
        }
    }
    return getIdentifierFromName(decorator.expression).getText();
}
function getIdentifierFromName(expression) {
    const identifier = getNameFromExpression(expression);
    if (expression && expression.kind !== typescript_1.SyntaxKind.Identifier) {
        throw new Error();
    }
    return identifier;
}
function getNameFromExpression(expression) {
    if (expression && expression.kind === typescript_1.SyntaxKind.PropertyAccessExpression) {
        return expression.name;
    }
    return expression;
}
function getJSDocDescription(node) {
    const jsDoc = node.jsDoc;
    if (!jsDoc || !jsDoc[0]) {
        return undefined;
    }
    return (0, typescript_1.getTextOfJSDocComment)(jsDoc[0].comment);
}
function hasJSDocTags(node, tagName) {
    const tags = (0, typescript_1.getJSDocTags)(node);
    return tags.some((tag) => tagName.includes(tag.tagName.text));
    // return jsDoc;
}
function getJsDocDeprecation(node) {
    const deprecatedTag = (0, typescript_1.getJSDocDeprecatedTag)(node);
    if (!deprecatedTag) {
        return undefined;
    }
    return (0, typescript_1.getTextOfJSDocComment)(deprecatedTag.comment) || 'deprecated';
}
function findNullableTypeFromUnion(typeNode, typeChecker) {
    return typeNode.types.find((tNode) => hasFlag(typeChecker.getTypeAtLocation(tNode), typescript_1.TypeFlags.Null));
}
function hasModifiers(modifiers, toCheck) {
    if (!modifiers) {
        return false;
    }
    return modifiers.some((modifier) => toCheck.includes(modifier.kind));
}
function hasDecorators(decorators, toCheck) {
    if (!decorators) {
        return false;
    }
    return decorators.some((decorator) => {
        return toCheck.includes(getDecoratorName(decorator));
    });
}
function hasImport(sf, what) {
    for (const statement of sf.statements) {
        if (ts.isImportDeclaration(statement) &&
            ts.isNamedImports(statement.importClause.namedBindings)) {
            const bindings = statement.importClause.namedBindings.elements;
            for (const namedBinding of bindings) {
                if (namedBinding.name.text === what) {
                    return true;
                }
            }
        }
    }
    return false;
}
function createImportEquals(f, identifier, from) {
    return f.createImportEqualsDeclaration(undefined, false, identifier, f.createExternalModuleReference(f.createStringLiteral(from)));
}
function createNamedImport(f, what, from) {
    const importClause = f.createImportClause(false, undefined, f.createNamedImports(what.map((name) => f.createImportSpecifier(false, undefined, f.createIdentifier(name)))));
    return f.createImportDeclaration(undefined, importClause, f.createStringLiteral(from));
}
function isCallExpressionOf(name, node) {
    return ts.isIdentifier(node.expression) && node.expression.text === name;
}
function isNode(value) {
    return typeof value === 'object' && value.constructor.name === 'NodeObject';
}
function serializePrimitiveObjectToAst(f, object) {
    const properties = [];
    Object.keys(object).forEach((key) => {
        const value = object[key];
        if (value === undefined) {
            return;
        }
        let initializer;
        if (isNode(value)) {
            initializer = value;
        }
        else if (typeof value === 'string') {
            initializer = f.createStringLiteral(value);
        }
        else if (typeof value === 'boolean') {
            initializer = value ? f.createTrue() : f.createFalse();
        }
        else if (typeof value === 'object') {
            initializer = serializePrimitiveObjectToAst(f, value);
        }
        properties.push(f.createPropertyAssignment(key, initializer));
    });
    return f.createObjectLiteralExpression(properties);
}
function safelyMergeObjects(f, a, b) {
    // if both of objects are ObjectLiterals, so merge property by property in compile time
    // if one or both of expressions not an object literal, produce rest spread and merge in runtime
    if (ts.isObjectLiteralExpression(a) && ts.isObjectLiteralExpression(b)) {
        const aMap = a.properties.reduce((acc, prop) => {
            acc[prop.name.text] = prop;
            return acc;
        }, {});
        b.properties.forEach((prop) => {
            aMap[prop.name.text] = prop;
        }, {});
        return f.createObjectLiteralExpression(Object.values(aMap));
    }
    else {
        return f.createObjectLiteralExpression([
            f.createSpreadAssignment(a),
            f.createSpreadAssignment(b),
        ]);
    }
}
function updateDecoratorArguments(f, node, decoratorName, replaceFn) {
    let updated = false;
    const nodeOriginalDecorators = getDecorators(node);
    const decorators = nodeOriginalDecorators.map((decorator) => {
        if (getDecoratorName(decorator) !== decoratorName) {
            return decorator;
        }
        const decoratorExpression = decorator.expression;
        updated = true;
        return f.updateDecorator(decorator, f.updateCallExpression(decoratorExpression, decoratorExpression.expression, decoratorExpression.typeArguments, replaceFn(decoratorExpression.arguments)));
    });
    if (!updated) {
        return node;
    }
    if (ts.isClassDeclaration(node)) {
        return f.updateClassDeclaration(node, [...decorators, ...getModifiers(node)], node.name, node.typeParameters, node.heritageClauses, node.members);
    }
    if (ts.isPropertyDeclaration(node)) {
        return f.updatePropertyDeclaration(node, [...decorators, ...getModifiers(node)], node.name, node.questionToken, node.type, node.initializer);
    }
    if (ts.isGetAccessorDeclaration(node)) {
        return f.updateGetAccessorDeclaration(node, [...decorators, ...getModifiers(node)], node.name, node.parameters, node.type, node.body);
    }
}
