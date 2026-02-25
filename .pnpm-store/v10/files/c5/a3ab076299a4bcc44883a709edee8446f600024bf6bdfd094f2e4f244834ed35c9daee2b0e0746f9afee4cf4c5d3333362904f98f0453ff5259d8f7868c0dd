"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFederationVersion = isFederationVersion;
exports.createSpecSchema = createSpecSchema;
exports.getLatestFederationVersion = getLatestFederationVersion;
exports.isFederationLink = isFederationLink;
exports.detectFederationVersion = detectFederationVersion;
const graphql_1 = require("graphql");
const printer_js_1 = require("../graphql/printer.js");
const inaccessible_js_1 = require("./inaccessible.js");
const link_js_1 = require("./link.js");
const tag_js_1 = require("./tag.js");
function isFederationVersion(version) {
    return version in federationSpecFactory;
}
function createSpecSchema(version, imports) {
    if (!isFederationVersion(version)) {
        throw new graphql_1.GraphQLError(`Invalid version ${version} for the federation feature in @link directive on schema`, {
            extensions: {
                code: "UNKNOWN_FEDERATION_LINK_VERSION",
            },
        });
    }
    if (version !== "v1.0") {
        const spec = federationSpecFactory[version]("", imports);
        const namespacedSpec = federationSpecFactory[version]("federation__");
        return {
            directives: spec.directives.concat(namespacedSpec.directives),
            types: spec.types.concat(namespacedSpec.types),
        };
    }
    const spec = federationSpecFactory[version]("");
    return {
        directives: spec.directives.concat([tag_js_1.directive, inaccessible_js_1.directive]),
        types: spec.types,
    };
}
const federationSpecFactory = {
    "v1.0": (prefix) => createTypeDefinitions(`
        directive @key(
          fields: _FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @requires(fields: _FieldSet!) on FIELD_DEFINITION
        directive @provides(fields: _FieldSet!) on FIELD_DEFINITION
        directive @external on OBJECT | FIELD_DEFINITION
        directive @extends on OBJECT | INTERFACE
        # @override is not supported in v1 but somehow it's supported by Apollo Composition
        directive @override(from: String!) on FIELD_DEFINITION
        scalar _FieldSet
      `, prefix),
    "v2.0": (prefix, imports) => createTypeDefinitions(`
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @external on OBJECT | FIELD_DEFINITION
        directive @shareable on FIELD_DEFINITION | OBJECT
        directive @extends on OBJECT | INTERFACE
        directive @override(from: String!) on FIELD_DEFINITION
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        scalar FieldSet
      `, prefix, imports),
    "v2.1": (prefix, imports) => createTypeDefinitions(`
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @override(from: String!) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        scalar FieldSet
      `, prefix, imports),
    "v2.2": (prefix, imports) => createTypeDefinitions(`
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @override(from: String!) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable repeatable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        scalar FieldSet
      `, prefix, imports),
    "v2.3": (prefix, imports) => createTypeDefinitions(`
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @interfaceObject on OBJECT
        directive @override(from: String!) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable repeatable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        scalar FieldSet
      `, prefix, imports),
    "v2.4": (prefix, imports) => createTypeDefinitions(`
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @interfaceObject on OBJECT
        directive @override(from: String!) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable repeatable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        scalar FieldSet
      `, prefix, imports),
    "v2.5": (prefix, imports) => createTypeDefinitions(`
        directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @requiresScopes(
          scopes: [[Scope!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @interfaceObject on OBJECT
        directive @override(from: String!) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable repeatable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        scalar FieldSet
        scalar Scope
      `, prefix, imports),
    "v2.6": (prefix, imports) => createTypeDefinitions(`
        directive @policy(
          policies: [[federation__Policy!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @requiresScopes(
          scopes: [[federation__Scope!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @interfaceObject on OBJECT
        directive @override(from: String!) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable repeatable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        scalar FieldSet
        scalar federation__Policy
        scalar federation__Scope
      `, prefix, imports),
    "v2.7": (prefix, imports) => createTypeDefinitions(`
        directive @policy(
          policies: [[federation__Policy!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @requiresScopes(
          scopes: [[federation__Scope!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @interfaceObject on OBJECT
        directive @override(from: String!, label: String) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable repeatable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        scalar FieldSet
        scalar federation__Policy
        scalar federation__Scope
      `, prefix, imports),
    "v2.8": (prefix, imports) => createTypeDefinitions(`
        directive @policy(
          policies: [[federation__Policy!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @requiresScopes(
          scopes: [[federation__Scope!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @interfaceObject on OBJECT
        directive @override(from: String!, label: String) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable repeatable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        directive @cost(
          weight: Int!
        ) on ARGUMENT_DEFINITION | ENUM | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | OBJECT | SCALAR
        directive @listSize(
          assumedSize: Int
          slicingArguments: [String!]
          sizedFields: [String!]
          requireOneSlicingArgument: Boolean = true
        ) on FIELD_DEFINITION
        directive @context(
          name: String!
        ) repeatable on INTERFACE | OBJECT | UNION
        directive @fromContext(
          field: federation__ContextFieldValue
        ) on ARGUMENT_DEFINITION
        scalar FieldSet
        scalar federation__Policy
        scalar federation__Scope
        scalar federation__ContextFieldValue
      `, prefix, imports),
    "v2.9": (prefix, imports) => createTypeDefinitions(`
        directive @policy(
          policies: [[federation__Policy!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @authenticated on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @requiresScopes(
          scopes: [[federation__Scope!]!]!
        ) on FIELD_DEFINITION | OBJECT | INTERFACE | SCALAR | ENUM
        directive @composeDirective(name: String!) repeatable on SCHEMA
        directive @extends on OBJECT | INTERFACE
        directive @external on OBJECT | FIELD_DEFINITION
        directive @key(
          fields: FieldSet!
          resolvable: Boolean = true
        ) repeatable on OBJECT | INTERFACE
        directive @inaccessible on FIELD_DEFINITION | OBJECT | INTERFACE | UNION | ENUM | ENUM_VALUE | SCALAR | INPUT_OBJECT | INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
        directive @interfaceObject on OBJECT
        directive @override(from: String!, label: String) on FIELD_DEFINITION
        directive @provides(fields: FieldSet!) on FIELD_DEFINITION
        directive @requires(fields: FieldSet!) on FIELD_DEFINITION
        directive @shareable repeatable on FIELD_DEFINITION | OBJECT
        directive @tag(
          name: String!
        ) repeatable on FIELD_DEFINITION | INTERFACE | OBJECT | UNION | ARGUMENT_DEFINITION | SCALAR | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
        directive @cost(
          weight: Int!
        ) on ARGUMENT_DEFINITION | ENUM | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | OBJECT | SCALAR
        directive @listSize(
          assumedSize: Int
          slicingArguments: [String!]
          sizedFields: [String!]
          requireOneSlicingArgument: Boolean = true
        ) on FIELD_DEFINITION
        directive @context(
          name: String!
        ) repeatable on INTERFACE | OBJECT | UNION
        directive @fromContext(
          field: federation__ContextFieldValue
        ) on ARGUMENT_DEFINITION
        scalar FieldSet
        scalar federation__Policy
        scalar federation__Scope
        scalar federation__ContextFieldValue
      `, prefix, imports),
};
function getLatestFederationVersion() {
    return Object.keys(federationSpecFactory).sort().pop();
}
function createTypeDefinitions(doc, prefix, imports) {
    const shouldFilter = !!imports;
    const toInclude = new Set(imports?.map((i) => i.name.replace(/^@/, "")));
    const docAST = (0, graphql_1.parse)(doc, {
        noLocation: true,
    });
    if (!imports?.length ||
        toInclude.has("key") ||
        toInclude.has("requires") ||
        toInclude.has("provides")) {
        toInclude.add("FieldSet");
        toInclude.add("federation__FieldSet");
    }
    if (toInclude.has("requiresScopes")) {
        toInclude.add("federation__Scope");
    }
    if (toInclude.has("policy")) {
        toInclude.add("federation__Policy");
    }
    const directives = [];
    const types = [];
    for (const node of docAST.definitions) {
        if (isDirectiveDefinitionNode(node)) {
            directives.push(applyPrefix(node, prefix));
        }
        else {
            types.push(applyPrefix(node, prefix));
        }
    }
    return {
        directives: directives.filter((d) => !graphql_1.specifiedDirectives.some((sd) => sd.name === d.name.value) &&
            (!shouldFilter || toInclude.has(d.name.value))),
        types: types.filter((t) => toInclude.has(t.name.value)),
    };
}
function isDirectiveDefinitionNode(node) {
    return node.kind === graphql_1.Kind.DIRECTIVE_DEFINITION;
}
function applyPrefix(node, prefix) {
    if (prefix.length === 0) {
        return node;
    }
    node.name.value = `${prefix}${node.name.value}`;
    if (isDirectiveDefinitionNode(node)) {
        node.arguments?.forEach((arg) => {
            const nameNode = resolveNamedType(arg.type);
            if (!graphql_1.specifiedScalarTypes.some((t) => t.name === nameNode.value)) {
                nameNode.value = `${prefix}${nameNode.value}`;
            }
        });
    }
    return node;
}
function resolveNamedType(node) {
    if (node.kind === graphql_1.Kind.LIST_TYPE) {
        return resolveNamedType(node.type);
    }
    if (node.kind === graphql_1.Kind.NON_NULL_TYPE) {
        return resolveNamedType(node.type);
    }
    return node.name;
}
function isFederationLink(link) {
    return link.identity === "https://specs.apollo.dev/federation";
}
function detectFederationVersion(typeDefs) {
    for (const definition of typeDefs.definitions) {
        if (definition.kind === graphql_1.Kind.SCHEMA_EXTENSION ||
            definition.kind === graphql_1.Kind.SCHEMA_DEFINITION) {
            const links = definition.directives?.filter((directive) => directive.name.value === "link");
            if (links?.length) {
                const parsedLinks = links.map((l) => {
                    const url = l.arguments?.find((a) => a.name.value === "url");
                    const importArg = l.arguments?.find((a) => a.name.value === "import");
                    if (!url) {
                        throw new Error("Invalid @link directive");
                    }
                    return (0, link_js_1.parseLink)(url.value.value, importArg ? (0, printer_js_1.print)(importArg.value) : "[]");
                });
                const fedLink = parsedLinks.find((l) => l.identity === "https://specs.apollo.dev/federation");
                if (fedLink?.version) {
                    if (!isFederationVersion(fedLink.version)) {
                        throw new Error(`Unsupported federation version: ${fedLink.version}`);
                    }
                    return {
                        version: fedLink.version,
                        imports: fedLink.imports,
                    };
                }
            }
        }
    }
    return { version: "v1.0", imports: [] };
}
