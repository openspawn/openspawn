"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformSupergraphToPublicSchema = transformSupergraphToPublicSchema;
const graphql_1 = require("graphql");
const index_js_1 = require("../utils/link/index.js");
const supergraph_spec_js_1 = require("./supergraph-spec.js");
const specifiedDirectives = new Set(graphql_1.specifiedDirectives.map((d) => d.name));
function getAdditionalDirectivesToStrip(documentNode) {
    const schemaDefinitionNode = documentNode.definitions.find((node) => node.kind === graphql_1.Kind.SCHEMA_DEFINITION);
    if (!schemaDefinitionNode?.directives?.length) {
        return null;
    }
    const additionalDirectivesToStrip = new Set();
    for (const directive of schemaDefinitionNode.directives) {
        if (directive.name.value !== "link") {
            continue;
        }
        const asArg = directive.arguments?.find((arg) => arg.name.value === "as");
        if (asArg?.value.kind === graphql_1.Kind.STRING) {
            additionalDirectivesToStrip.add(asArg.value.value);
        }
    }
    return additionalDirectivesToStrip;
}
const federationInaccessibleDirectiveUrlPrefix = "https://specs.apollo.dev/inaccessible";
function getInaccessibleDirectiveName(documentNode) {
    const schemaDefinitionNode = documentNode.definitions.find((node) => node.kind === graphql_1.Kind.SCHEMA_DEFINITION);
    if (schemaDefinitionNode?.directives?.length) {
        for (const directive of schemaDefinitionNode.directives) {
            if (directive.name.value !== "link") {
                continue;
            }
            const urlArg = directive.arguments?.find((arg) => arg.name.value === "url");
            const asArg = directive.arguments?.find((arg) => arg.name.value === "as");
            if (urlArg?.value.kind === graphql_1.Kind.STRING &&
                urlArg.value.value.startsWith(federationInaccessibleDirectiveUrlPrefix)) {
                if (asArg?.value.kind === graphql_1.Kind.STRING) {
                    return asArg.value.value;
                }
                break;
            }
        }
    }
    return "inaccessible";
}
function transformSupergraphToPublicSchema(documentNode) {
    const additionalFederationDirectives = getAdditionalDirectivesToStrip(documentNode);
    const inaccessibleDirectiveName = getInaccessibleDirectiveName(documentNode);
    const specLinks = (0, index_js_1.extractLinkImplementations)(documentNode).links.filter((link) => link.identity.includes("//specs.apollo.dev/"));
    const specPrefixes = specLinks.map((l) => l.identity.substring(l.identity.lastIndexOf("/") + 1) + "__");
    const supergraphSpecNodeNames = (0, supergraph_spec_js_1.getSupergraphSpecNodes)();
    const supergraphDirectives = new Set();
    const supergraphEnums = new Set();
    const supergraphInputObjects = new Set();
    const supergraphScalars = new Set();
    for (const { kind, name } of supergraphSpecNodeNames) {
        if (kind === graphql_1.Kind.ENUM_TYPE_DEFINITION) {
            supergraphEnums.add(name);
        }
        else if (kind === graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION) {
            supergraphInputObjects.add(name);
        }
        else if (kind === graphql_1.Kind.SCALAR_TYPE_DEFINITION) {
            supergraphScalars.add(name);
        }
        else if (kind === graphql_1.Kind.DIRECTIVE_DEFINITION) {
            supergraphDirectives.add(name);
        }
    }
    const importedPieces = specLinks
        .map((l) => l.imports.map((i) => i.as ?? i.name))
        .flat();
    const definitionsToRemove = new Set(importedPieces.map((name) => name.replace("@", "")));
    const directivesToRemove = new Set(importedPieces
        .filter((name) => name.startsWith("@"))
        .map((name) => name.substring(1)));
    function removeFederationOrSpecifiedDirectives(node) {
        if (belongsToLinkedSpec(node) ||
            supergraphDirectives.has(node.name.value) ||
            supergraph_spec_js_1.extraFederationDirectiveNames.has(node.name.value) ||
            additionalFederationDirectives?.has(node.name.value) ||
            directivesToRemove.has(node.name.value) ||
            (node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION &&
                specifiedDirectives.has(node.name.value))) {
            return null;
        }
    }
    function belongsToLinkedSpec(node) {
        return specPrefixes.some((prefix) => node.name.value.startsWith(prefix));
    }
    function hasInaccessibleDirective(node) {
        return node.directives?.some((d) => d.name.value === inaccessibleDirectiveName);
    }
    const inaccessibleInterfaceTypes = new Set();
    function removeInaccessibleNode(node) {
        if (hasInaccessibleDirective(node) || belongsToLinkedSpec(node)) {
            if (node.kind === graphql_1.Kind.INTERFACE_TYPE_DEFINITION) {
                inaccessibleInterfaceTypes.add(node.name.value);
            }
            return null;
        }
    }
    const newDocumentNode = (0, graphql_1.visit)(documentNode, {
        [graphql_1.Kind.DIRECTIVE_DEFINITION]: removeFederationOrSpecifiedDirectives,
        [graphql_1.Kind.DIRECTIVE]: removeFederationOrSpecifiedDirectives,
        [graphql_1.Kind.SCHEMA_EXTENSION]: () => null,
        [graphql_1.Kind.SCHEMA_DEFINITION]: () => null,
        [graphql_1.Kind.SCALAR_TYPE_DEFINITION](node) {
            if (belongsToLinkedSpec(node) ||
                supergraphScalars.has(node.name.value) ||
                supergraph_spec_js_1.extraFederationTypeNames.has(node.name.value) ||
                definitionsToRemove.has(node.name.value) ||
                hasInaccessibleDirective(node)) {
                return null;
            }
        },
        [graphql_1.Kind.ENUM_TYPE_DEFINITION](node) {
            if (belongsToLinkedSpec(node) ||
                supergraphEnums.has(node.name.value) ||
                supergraph_spec_js_1.extraFederationTypeNames.has(node.name.value) ||
                definitionsToRemove.has(node.name.value) ||
                hasInaccessibleDirective(node)) {
                return null;
            }
        },
        [graphql_1.Kind.ENUM_VALUE_DEFINITION]: removeInaccessibleNode,
        [graphql_1.Kind.OBJECT_TYPE_DEFINITION]: removeInaccessibleNode,
        [graphql_1.Kind.FIELD_DEFINITION]: removeInaccessibleNode,
        [graphql_1.Kind.INTERFACE_TYPE_DEFINITION]: removeInaccessibleNode,
        [graphql_1.Kind.UNION_TYPE_DEFINITION]: removeInaccessibleNode,
        [graphql_1.Kind.INPUT_OBJECT_TYPE_DEFINITION](node) {
            if (belongsToLinkedSpec(node) ||
                supergraphInputObjects.has(node.name.value) ||
                definitionsToRemove.has(node.name.value) ||
                hasInaccessibleDirective(node)) {
                return null;
            }
        },
        [graphql_1.Kind.INPUT_VALUE_DEFINITION]: removeInaccessibleNode,
    });
    if (!inaccessibleInterfaceTypes.size) {
        return newDocumentNode;
    }
    function removeInaccessibleInterfaces(node) {
        if (!node.interfaces) {
            return;
        }
        const newInterfaces = node.interfaces.filter((value) => !inaccessibleInterfaceTypes.has(value.name.value));
        if (newInterfaces.length === node.interfaces.length) {
            return;
        }
        return {
            ...node,
            interfaces: newInterfaces,
        };
    }
    return (0, graphql_1.visit)(newDocumentNode, {
        [graphql_1.Kind.OBJECT_TYPE_DEFINITION]: removeInaccessibleInterfaces,
        [graphql_1.Kind.INTERFACE_TYPE_DEFINITION]: removeInaccessibleInterfaces,
    });
}
